package service

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"open-source-club-nav/backend/config"
)

const (
	deployPhaseIdle      = "idle"
	deployPhaseChecking  = "checking"
	deployPhaseDeploying = "deploying"
	deployPhaseSuccess   = "success"
	deployPhaseFailed    = "failed"

	defaultDeployRepoPath     = "/opt/openatom-club"
	defaultDeployUpdateScript = "deploy/update.sh"
	defaultDeployAllowedTag   = "v*"
	defaultDeployStatusFile   = "/tmp/openatom-tag-update-status.env"
	defaultDeployLogFile      = "/tmp/openatom-tag-update.log"
)

type DeployStatus struct {
	Phase         string     `json:"phase"`
	JobID         string     `json:"job_id"`
	CurrentTag    string     `json:"current_tag"`
	CurrentCommit string     `json:"current_commit"`
	LatestTag     string     `json:"latest_tag"`
	HasUpdate     bool       `json:"has_update"`
	RepoPath      string     `json:"repo_path"`
	UpdateScript  string     `json:"update_script"`
	StartedAt     *time.Time `json:"started_at,omitempty"`
	FinishedAt    *time.Time `json:"finished_at,omitempty"`
	Error         string     `json:"error,omitempty"`
	Logs          []string   `json:"logs"`
}

type deployRuntimeConfig struct {
	RepoPath     string
	UpdateScript string
	AllowedTags  []string
}

type deployManager struct {
	mu     sync.Mutex
	status DeployStatus
}

var globalDeployManager = &deployManager{
	status: DeployStatus{
		Phase: deployPhaseIdle,
		Logs:  []string{},
	},
}

func CheckDeployUpdates(ctx context.Context, cfg *config.Config) (DeployStatus, error) {
	runtimeCfg, err := resolveDeployConfig(cfg)
	if err != nil {
		return globalDeployManager.failCheck(runtimeCfg, err), err
	}

	if globalDeployManager.isDeploying() {
		return globalDeployManager.snapshotWithConfig(runtimeCfg), nil
	}

	globalDeployManager.startCheck(runtimeCfg)
	currentTag, currentCommit, err := currentGitRef(ctx, runtimeCfg.RepoPath)
	if err != nil {
		return globalDeployManager.failCheck(runtimeCfg, err), err
	}
	latestTag, err := latestRemoteTag(ctx, runtimeCfg)
	if err != nil {
		return globalDeployManager.failCheck(runtimeCfg, err), err
	}

	status := globalDeployManager.finishCheck(runtimeCfg, currentTag, currentCommit, latestTag)
	return status, nil
}

func TriggerDeployUpdate(ctx context.Context, cfg *config.Config) (DeployStatus, error) {
	runtimeCfg, err := resolveDeployConfig(cfg)
	if err != nil {
		return globalDeployManager.failCheck(runtimeCfg, err), err
	}

	if globalDeployManager.isDeploying() {
		return globalDeployManager.snapshotWithConfig(runtimeCfg), errors.New("部署任务正在运行")
	}

	currentTag, currentCommit, err := currentGitRef(ctx, runtimeCfg.RepoPath)
	if err != nil {
		return globalDeployManager.failCheck(runtimeCfg, err), err
	}
	latestTag, err := latestRemoteTag(ctx, runtimeCfg)
	if err != nil {
		return globalDeployManager.failCheck(runtimeCfg, err), err
	}
	if latestTag == "" {
		return globalDeployManager.failCheck(runtimeCfg, errors.New("远程仓库没有匹配的 tag")), errors.New("远程仓库没有匹配的 tag")
	}
	if currentTag == latestTag {
		status := globalDeployManager.finishCheck(runtimeCfg, currentTag, currentCommit, latestTag)
		return status, errors.New("当前已经是最新 tag")
	}

	jobID := newDeployJobID()
	status := globalDeployManager.startDeploy(runtimeCfg, jobID, currentTag, currentCommit, latestTag)
	if err := startDetachedDeployJob(runtimeCfg, jobID, latestTag); err != nil {
		globalDeployManager.finishDeploy(jobID, err)
		return globalDeployManager.snapshotWithConfig(runtimeCfg), err
	}
	return status, nil
}

func GetDeployStatus(cfg *config.Config) DeployStatus {
	runtimeCfg, _ := resolveDeployConfig(cfg)
	status := globalDeployManager.snapshotWithConfig(runtimeCfg)
	return mergePersistedDeployStatus(status, runtimeCfg)
}

func (m *deployManager) isDeploying() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.status.Phase == deployPhaseDeploying || m.status.Phase == deployPhaseChecking
}

func (m *deployManager) startCheck(runtimeCfg deployRuntimeConfig) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.status.Phase = deployPhaseChecking
	m.status.RepoPath = runtimeCfg.RepoPath
	m.status.UpdateScript = runtimeCfg.UpdateScript
	m.status.Error = ""
	m.status.Logs = appendDeployLog(m.status.Logs, "开始检查远程 tag")
}

func (m *deployManager) finishCheck(runtimeCfg deployRuntimeConfig, currentTag, currentCommit, latestTag string) DeployStatus {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.status.Phase = deployPhaseIdle
	m.status.CurrentTag = currentTag
	m.status.CurrentCommit = currentCommit
	m.status.LatestTag = latestTag
	m.status.HasUpdate = latestTag != "" && latestTag != currentTag
	m.status.RepoPath = runtimeCfg.RepoPath
	m.status.UpdateScript = runtimeCfg.UpdateScript
	m.status.Error = ""
	if m.status.HasUpdate {
		m.status.Logs = appendDeployLog(m.status.Logs, fmt.Sprintf("发现新 tag: %s -> %s", emptyDash(currentTag), latestTag))
	} else {
		m.status.Logs = appendDeployLog(m.status.Logs, fmt.Sprintf("未发现新 tag，当前版本: %s", emptyDash(currentTag)))
	}
	return cloneDeployStatus(m.status)
}

func (m *deployManager) startDeploy(runtimeCfg deployRuntimeConfig, jobID, currentTag, currentCommit, latestTag string) DeployStatus {
	now := time.Now()
	m.mu.Lock()
	defer m.mu.Unlock()
	m.status = DeployStatus{
		Phase:         deployPhaseDeploying,
		JobID:         jobID,
		CurrentTag:    currentTag,
		CurrentCommit: currentCommit,
		LatestTag:     latestTag,
		HasUpdate:     true,
		RepoPath:      runtimeCfg.RepoPath,
		UpdateScript:  runtimeCfg.UpdateScript,
		StartedAt:     &now,
		Logs:          []string{fmt.Sprintf("[%s] 启动部署任务 %s，目标 tag: %s", now.Format(time.RFC3339), jobID, latestTag)},
	}
	return cloneDeployStatus(m.status)
}

func (m *deployManager) appendLog(jobID, line string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.status.JobID != jobID {
		return
	}
	m.status.Logs = appendDeployLog(m.status.Logs, line)
}

func (m *deployManager) finishDeploy(jobID string, err error) {
	now := time.Now()
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.status.JobID != jobID {
		return
	}
	m.status.FinishedAt = &now
	if err != nil {
		m.status.Phase = deployPhaseFailed
		m.status.Error = err.Error()
		m.status.Logs = appendDeployLog(m.status.Logs, "部署失败: "+err.Error())
		return
	}
	m.status.Phase = deployPhaseSuccess
	m.status.HasUpdate = false
	m.status.CurrentTag = m.status.LatestTag
	m.status.Error = ""
	m.status.Logs = appendDeployLog(m.status.Logs, "部署完成")
}

func (m *deployManager) failCheck(runtimeCfg deployRuntimeConfig, err error) DeployStatus {
	now := time.Now()
	m.mu.Lock()
	defer m.mu.Unlock()
	m.status.Phase = deployPhaseFailed
	m.status.RepoPath = runtimeCfg.RepoPath
	m.status.UpdateScript = runtimeCfg.UpdateScript
	m.status.Error = err.Error()
	m.status.FinishedAt = &now
	m.status.Logs = appendDeployLog(m.status.Logs, err.Error())
	return cloneDeployStatus(m.status)
}

func (m *deployManager) snapshotWithConfig(runtimeCfg deployRuntimeConfig) DeployStatus {
	m.mu.Lock()
	defer m.mu.Unlock()
	status := cloneDeployStatus(m.status)
	if status.Phase == "" {
		status.Phase = deployPhaseIdle
	}
	if status.RepoPath == "" {
		status.RepoPath = runtimeCfg.RepoPath
	}
	if status.UpdateScript == "" {
		status.UpdateScript = runtimeCfg.UpdateScript
	}
	return status
}

func startDetachedDeployJob(runtimeCfg deployRuntimeConfig, jobID, targetTag string) error {
	scriptPath := runtimeCfg.UpdateScript
	if !filepath.IsAbs(scriptPath) {
		scriptPath = filepath.Join(runtimeCfg.RepoPath, scriptPath)
	}

	launcher := `
if command -v setsid >/dev/null 2>&1; then
  nohup setsid bash "$1" --tag "$2" >/dev/null 2>&1 </dev/null &
else
  nohup bash "$1" --tag "$2" >/dev/null 2>&1 </dev/null &
fi
`
	cmd := exec.Command("sh", "-c", launcher, "openatom-deploy-launcher", scriptPath, targetTag)
	cmd.Dir = runtimeCfg.RepoPath
	cmd.Env = append(os.Environ(),
		"DEPLOY_PATH="+runtimeCfg.RepoPath,
		"DEPLOY_TARGET_TAG="+targetTag,
		"DEPLOY_JOB_ID="+jobID,
		"DEPLOY_STATUS_FILE="+deployStatusFilePath(),
		"DEPLOY_LOG_FILE="+deployLogFilePath(),
	)

	devNull, err := os.OpenFile(os.DevNull, os.O_RDWR, 0)
	if err != nil {
		return err
	}
	defer devNull.Close()

	cmd.Stdin = devNull
	cmd.Stdout = devNull
	cmd.Stderr = devNull

	return cmd.Run()
}

func mergePersistedDeployStatus(status DeployStatus, runtimeCfg deployRuntimeConfig) DeployStatus {
	persisted, ok := readPersistedDeployStatus(runtimeCfg)
	if !ok {
		return status
	}

	if status.JobID == "" && status.CurrentTag == "" && status.LatestTag == "" && len(status.Logs) == 0 {
		return persisted
	}
	if status.JobID != "" && status.JobID == persisted.JobID {
		if len(persisted.Logs) > len(status.Logs) {
			status.Logs = persisted.Logs
		}
		if persisted.Phase == deployPhaseSuccess || persisted.Phase == deployPhaseFailed {
			status.Phase = persisted.Phase
			status.FinishedAt = persisted.FinishedAt
			status.Error = persisted.Error
			status.HasUpdate = persisted.HasUpdate
			status.CurrentTag = persisted.CurrentTag
		}
	}
	return status
}

func readPersistedDeployStatus(runtimeCfg deployRuntimeConfig) (DeployStatus, bool) {
	values, ok := readDeployStateFile(deployStatusFilePath())
	if !ok {
		return DeployStatus{}, false
	}

	status := DeployStatus{
		Phase:        valueOrDefault(values["phase"], deployPhaseIdle),
		JobID:        values["job_id"],
		LatestTag:    values["latest_tag"],
		RepoPath:     valueOrDefault(values["repo_path"], runtimeCfg.RepoPath),
		UpdateScript: valueOrDefault(values["update_script"], runtimeCfg.UpdateScript),
		Error:        values["error"],
	}
	status.StartedAt = parseDeployTime(values["started_at"])
	status.FinishedAt = parseDeployTime(values["finished_at"])
	status.Logs = readDeployLogLines(valueOrDefault(values["log_file"], deployLogFilePath()))

	if status.Phase == deployPhaseSuccess {
		status.CurrentTag = status.LatestTag
		status.HasUpdate = false
	} else if status.LatestTag != "" {
		status.HasUpdate = true
	}
	if status.Phase == "" {
		status.Phase = deployPhaseIdle
	}
	return status, true
}

func readDeployStateFile(filename string) (map[string]string, bool) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, false
	}
	defer file.Close()

	values := map[string]string{}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		values[strings.TrimSpace(key)] = strings.TrimSpace(value)
	}
	if len(values) == 0 {
		return nil, false
	}
	return values, true
}

func readDeployLogLines(filename string) []string {
	file, err := os.Open(filename)
	if err != nil {
		return nil
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			lines = append(lines, line)
		}
		if len(lines) > 300 {
			lines = lines[len(lines)-300:]
		}
	}
	return lines
}

func parseDeployTime(value string) *time.Time {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(value))
	if err != nil {
		return nil
	}
	return &parsed
}

func deployStatusFilePath() string {
	if value := strings.TrimSpace(os.Getenv("DEPLOY_STATUS_FILE")); value != "" {
		return value
	}
	return defaultDeployStatusFile
}

func deployLogFilePath() string {
	if value := strings.TrimSpace(os.Getenv("DEPLOY_LOG_FILE")); value != "" {
		return value
	}
	return defaultDeployLogFile
}

func valueOrDefault(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func resolveDeployConfig(cfg *config.Config) (deployRuntimeConfig, error) {
	runtimeCfg := deployRuntimeConfig{
		RepoPath:     defaultDeployRepoPath,
		UpdateScript: defaultDeployUpdateScript,
		AllowedTags:  []string{defaultDeployAllowedTag},
	}
	if cfg != nil {
		if strings.TrimSpace(cfg.Deploy.RepoPath) != "" {
			runtimeCfg.RepoPath = strings.TrimSpace(cfg.Deploy.RepoPath)
		}
		if strings.TrimSpace(cfg.Deploy.UpdateScript) != "" {
			runtimeCfg.UpdateScript = strings.TrimSpace(cfg.Deploy.UpdateScript)
		}
		if len(cfg.Deploy.AllowedTags) > 0 {
			runtimeCfg.AllowedTags = cfg.Deploy.AllowedTags
		}
	}
	if value := strings.TrimSpace(os.Getenv("DEPLOY_REPO_PATH")); value != "" {
		runtimeCfg.RepoPath = value
	}
	if value := strings.TrimSpace(os.Getenv("DEPLOY_UPDATE_SCRIPT")); value != "" {
		runtimeCfg.UpdateScript = value
	}
	if value := strings.TrimSpace(os.Getenv("DEPLOY_ALLOWED_TAGS")); value != "" {
		runtimeCfg.AllowedTags = splitDeployCSV(value)
	}

	absRepo, err := filepath.Abs(runtimeCfg.RepoPath)
	if err != nil {
		return runtimeCfg, err
	}
	runtimeCfg.RepoPath = absRepo
	if _, err := os.Stat(filepath.Join(runtimeCfg.RepoPath, ".git")); err != nil {
		return runtimeCfg, fmt.Errorf("部署目录不是 Git 仓库: %s", runtimeCfg.RepoPath)
	}

	scriptPath := runtimeCfg.UpdateScript
	if !filepath.IsAbs(scriptPath) {
		scriptPath = filepath.Join(runtimeCfg.RepoPath, scriptPath)
	}
	if _, err := os.Stat(scriptPath); err != nil {
		return runtimeCfg, fmt.Errorf("部署脚本不存在: %s", scriptPath)
	}
	return runtimeCfg, nil
}

func currentGitRef(ctx context.Context, repoPath string) (string, string, error) {
	commit, err := runGit(ctx, repoPath, "rev-parse", "--short", "HEAD")
	if err != nil {
		return "", "", err
	}
	currentTag, err := runGit(ctx, repoPath, "describe", "--tags", "--exact-match", "HEAD")
	if err != nil {
		currentTag, _ = runGit(ctx, repoPath, "describe", "--tags", "--abbrev=0")
	}
	return strings.TrimSpace(currentTag), strings.TrimSpace(commit), nil
}

func latestRemoteTag(ctx context.Context, runtimeCfg deployRuntimeConfig) (string, error) {
	output, err := runGit(ctx, runtimeCfg.RepoPath, "ls-remote", "--tags", "--refs", "origin")
	if err != nil {
		return "", err
	}
	tags := parseRemoteTags(output, runtimeCfg.AllowedTags)
	if len(tags) == 0 {
		return "", nil
	}
	sort.Slice(tags, func(i, j int) bool {
		return compareTags(tags[i], tags[j]) < 0
	})
	return tags[len(tags)-1], nil
}

func runGit(ctx context.Context, repoPath string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", append([]string{"-C", repoPath}, args...)...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s failed: %s", strings.Join(args, " "), strings.TrimSpace(string(output)))
	}
	return strings.TrimSpace(string(output)), nil
}

func parseRemoteTags(output string, patterns []string) []string {
	seen := make(map[string]struct{})
	for _, line := range strings.Split(output, "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 || !strings.HasPrefix(fields[1], "refs/tags/") {
			continue
		}
		tag := strings.TrimPrefix(fields[1], "refs/tags/")
		if tag == "" || !tagAllowed(tag, patterns) {
			continue
		}
		seen[tag] = struct{}{}
	}

	tags := make([]string, 0, len(seen))
	for tag := range seen {
		tags = append(tags, tag)
	}
	return tags
}

func tagAllowed(tag string, patterns []string) bool {
	if len(patterns) == 0 {
		return true
	}
	for _, pattern := range patterns {
		pattern = strings.TrimSpace(pattern)
		if pattern == "" {
			continue
		}
		ok, err := path.Match(pattern, tag)
		if err == nil && ok {
			return true
		}
	}
	return false
}

func compareTags(a, b string) int {
	aa := tokenizeTag(a)
	bb := tokenizeTag(b)
	for i := 0; i < len(aa) && i < len(bb); i++ {
		left, right := aa[i], bb[i]
		leftNum, leftErr := strconv.Atoi(left)
		rightNum, rightErr := strconv.Atoi(right)
		if leftErr == nil && rightErr == nil {
			if leftNum < rightNum {
				return -1
			}
			if leftNum > rightNum {
				return 1
			}
			continue
		}
		if left < right {
			return -1
		}
		if left > right {
			return 1
		}
	}
	if len(aa) < len(bb) {
		return -1
	}
	if len(aa) > len(bb) {
		return 1
	}
	return strings.Compare(a, b)
}

func tokenizeTag(tag string) []string {
	tag = strings.TrimPrefix(strings.TrimPrefix(tag, "v"), "V")
	var tokens []string
	var current strings.Builder
	var currentDigit *bool
	for _, r := range tag {
		isDigit := r >= '0' && r <= '9'
		if currentDigit != nil && *currentDigit != isDigit {
			tokens = append(tokens, current.String())
			current.Reset()
		}
		current.WriteRune(r)
		value := isDigit
		currentDigit = &value
	}
	if current.Len() > 0 {
		tokens = append(tokens, current.String())
	}
	return tokens
}

func newDeployJobID() string {
	var bytes [4]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes[:])
}

func appendDeployLog(logs []string, line string) []string {
	line = strings.TrimSpace(line)
	if line == "" {
		return logs
	}
	logs = append(logs, fmt.Sprintf("[%s] %s", time.Now().Format("15:04:05"), line))
	if len(logs) > 300 {
		return logs[len(logs)-300:]
	}
	return logs
}

func cloneDeployStatus(status DeployStatus) DeployStatus {
	cloned := status
	cloned.Logs = append([]string(nil), status.Logs...)
	if cloned.Phase == "" {
		cloned.Phase = deployPhaseIdle
	}
	return cloned
}

func splitDeployCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func emptyDash(value string) string {
	if strings.TrimSpace(value) == "" {
		return "-"
	}
	return value
}
