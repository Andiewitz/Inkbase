package api_test

import (
	"strings"
	"testing"

	"inkbase/server/shared"
)

func TestValidateEmail(t *testing.T) {
	t.Parallel()

	// Build a string that exceeds the 320-character limit.
	tooLong := strings.Repeat("a", 310) + "@example.com"

	cases := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid basic", "user@example.com", false},
		{"valid with plus", "user+tag@example.io", false},
		{"valid with dots", "first.last@company.co.uk", false},
		{"valid subdomain", "me@mail.inkbase.app", false},
		{"empty string", "", true},
		{"whitespace only", "   ", true},
		{"no at sign", "notanemail", true},
		{"no local part", "@nodomain.com", true},
		{"no domain", "user@", true},
		{"no tld", "user@nodot", true},
		{"too long", tooLong, true},
		// SQL injection characters are rejected by the email regex — the real
		// protection is parameterised queries, but this validates defence-in-depth.
		{"sql injection attempt", "' OR 1=1 --@x.com", true},
	}

	for _, c := range cases {
		c := c
		t.Run(c.name, func(t *testing.T) {
			t.Parallel()
			err := shared.ValidateEmail(c.input)
			if (err != nil) != c.wantErr {
				t.Errorf("ValidateEmail(%q) err=%v, wantErr=%v", c.input, err, c.wantErr)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	t.Parallel()

	tooLong := strings.Repeat("a", 73)
	withNull := "hello\x00world"  // null byte — no legitimate use in a password
	withCtrl := "password\x01ok" // \x01 SOH control character

	cases := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid common passphrase", "correct-horse-battery", false},
		{"valid with special chars", "P@$$w0rd!", false},
		{"valid with spaces", "a password with spaces", false},
		{"valid with unicode", "pässwörд123!", false},
		{"exactly 8 chars (min)", "12345678", false},
		{"exactly 72 chars (max)", strings.Repeat("a", 72), false},
		{"too short — 5 chars", "short", true},
		{"too short — 7 chars", "1234567", true},
		{"too long — 73 chars", tooLong, true},
		{"contains null byte", withNull, true},
		{"contains control char", withCtrl, true},
		{"empty string", "", true},
	}

	for _, c := range cases {
		c := c
		t.Run(c.name, func(t *testing.T) {
			t.Parallel()
			err := shared.ValidatePassword(c.input)
			if (err != nil) != c.wantErr {
				t.Errorf("ValidatePassword(%q) err=%v, wantErr=%v", c.input, err, c.wantErr)
			}
		})
	}
}
