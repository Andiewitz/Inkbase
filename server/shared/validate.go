package shared

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// emailRe is a practical email regex. It is intentionally not RFC 5321 complete
// — that regex is enormous and accepts addresses no real mail server honours.
var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

const (
	maxEmailLen = 320 // RFC 5321 hard limit

	minPasswordLen = 8
	maxPasswordLen = 72 // bcrypt silently truncates at 72 bytes — cap it here
)

// ValidateEmail returns a non-nil error if s is not a well-formed email address.
func ValidateEmail(s string) error {
	s = strings.TrimSpace(s)
	if s == "" {
		return fmt.Errorf("email is required")
	}
	if len(s) > maxEmailLen {
		return fmt.Errorf("email must be %d characters or fewer", maxEmailLen)
	}
	if !emailRe.MatchString(s) {
		return fmt.Errorf("email format is invalid")
	}
	return nil
}

// ValidatePassword returns a non-nil error if s is not an acceptable password.
//
// Rules:
//   - 8–72 characters (bcrypt truncates silently at 72)
//   - No null bytes or non-space control characters
//
// Special characters, Unicode, and punctuation are explicitly ALLOWED — blocking
// them only weakens passwords. SQL injection is already impossible here because
// all queries use parameterised placeholders; this layer is a defence-in-depth
// check that rejects inputs which have no legitimate place in a password field.
func ValidatePassword(s string) error {
	if len(s) < minPasswordLen {
		return fmt.Errorf("password must be at least %d characters", minPasswordLen)
	}
	if len(s) > maxPasswordLen {
		return fmt.Errorf("password must be at most %d characters", maxPasswordLen)
	}
	for _, r := range s {
		// Null bytes and control characters (except horizontal whitespace like
		// space and tab) have no place in a password field.
		if r == 0 || (unicode.IsControl(r) && !unicode.IsSpace(r)) {
			return fmt.Errorf("password contains invalid characters")
		}
	}
	return nil
}

// ValidateNonEmpty returns a non-nil error if s is empty after trimming.
// Use for required plain-text fields that have no additional format rules.
func ValidateNonEmpty(field, s string) error {
	if strings.TrimSpace(s) == "" {
		return fmt.Errorf("%s is required", field)
	}
	return nil
}
