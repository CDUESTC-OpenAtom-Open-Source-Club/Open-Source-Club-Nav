package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProbeLinkFallsBackToGetWhenHeadReturnsNotFound(t *testing.T) {
	server, counts := newProbeTestServer(http.StatusNotFound, http.StatusOK)
	defer server.Close()

	ok, statusCode, message := probeLink(server.Client(), server.URL)

	if !ok {
		t.Fatalf("HEAD 404 but GET 200 should be healthy, message=%q", message)
	}
	if statusCode == nil || *statusCode != http.StatusOK {
		t.Fatalf("expected final status 200, got %v", statusCode)
	}
	if message != "OK" {
		t.Fatalf("expected OK message, got %q", message)
	}
	if counts.head != 1 || counts.get != 1 {
		t.Fatalf("expected one HEAD and one GET, got HEAD=%d GET=%d", counts.head, counts.get)
	}
}

func TestProbeLinkFallsBackToGetWhenHeadReturnsMethodNotAllowed(t *testing.T) {
	server, counts := newProbeTestServer(http.StatusMethodNotAllowed, http.StatusOK)
	defer server.Close()

	ok, statusCode, message := probeLink(server.Client(), server.URL)

	if !ok {
		t.Fatalf("HEAD 405 but GET 200 should be healthy, message=%q", message)
	}
	if statusCode == nil || *statusCode != http.StatusOK {
		t.Fatalf("expected final status 200, got %v", statusCode)
	}
	if counts.head != 1 || counts.get != 1 {
		t.Fatalf("expected one HEAD and one GET, got HEAD=%d GET=%d", counts.head, counts.get)
	}
}

func TestProbeLinkDoesNotFallbackWhenHeadIsHealthy(t *testing.T) {
	server, counts := newProbeTestServer(http.StatusOK, http.StatusInternalServerError)
	defer server.Close()

	ok, statusCode, message := probeLink(server.Client(), server.URL)

	if !ok {
		t.Fatalf("HEAD 200 should be healthy, message=%q", message)
	}
	if statusCode == nil || *statusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %v", statusCode)
	}
	if counts.head != 1 || counts.get != 0 {
		t.Fatalf("expected one HEAD and no GET fallback, got HEAD=%d GET=%d", counts.head, counts.get)
	}
}

func TestProbeLinkReturnsGetFailureAfterFallback(t *testing.T) {
	server, counts := newProbeTestServer(http.StatusNotFound, http.StatusNotFound)
	defer server.Close()

	ok, statusCode, message := probeLink(server.Client(), server.URL)

	if ok {
		t.Fatalf("HEAD 404 and GET 404 should be unhealthy")
	}
	if statusCode == nil || *statusCode != http.StatusNotFound {
		t.Fatalf("expected final status 404, got %v", statusCode)
	}
	if message != "404 Not Found" {
		t.Fatalf("expected GET status message, got %q", message)
	}
	if counts.head != 1 || counts.get != 1 {
		t.Fatalf("expected one HEAD and one GET, got HEAD=%d GET=%d", counts.head, counts.get)
	}
}

type probeRequestCounts struct {
	head int
	get  int
}

func newProbeTestServer(headStatus int, getStatus int) (*httptest.Server, *probeRequestCounts) {
	counts := &probeRequestCounts{}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodHead:
			counts.head++
			w.WriteHeader(headStatus)
		case http.MethodGet:
			counts.get++
			w.WriteHeader(getStatus)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}))

	return server, counts
}
