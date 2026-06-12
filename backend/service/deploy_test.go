package service

import "testing"

func TestParseRemoteTagsFiltersAllowedPatterns(t *testing.T) {
	output := "a1 refs/tags/v1.0.0\n" +
		"b2 refs/tags/release-2026\n" +
		"c3 refs/heads/main\n" +
		"d4 refs/tags/v1.1.0\n"

	tags := parseRemoteTags(output, []string{"v*"})
	if len(tags) != 2 {
		t.Fatalf("expected 2 tags, got %d: %#v", len(tags), tags)
	}

	seen := map[string]bool{}
	for _, tag := range tags {
		seen[tag] = true
	}
	for _, expected := range []string{"v1.0.0", "v1.1.0"} {
		if !seen[expected] {
			t.Fatalf("expected tag %q in %#v", expected, tags)
		}
	}
	if seen["release-2026"] {
		t.Fatalf("unexpected disallowed tag in %#v", tags)
	}
}

func TestCompareTagsSortsNumericSegments(t *testing.T) {
	if compareTags("v1.10.0", "v1.9.0") <= 0 {
		t.Fatal("expected v1.10.0 to sort after v1.9.0")
	}
	if compareTags("v2.0.0", "v10.0.0") >= 0 {
		t.Fatal("expected v2.0.0 to sort before v10.0.0")
	}
	if compareTags("v1.0.0", "v1.0.0") != 0 {
		t.Fatal("expected identical tags to compare equal")
	}
}
