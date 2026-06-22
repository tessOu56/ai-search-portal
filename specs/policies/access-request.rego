package access

import future.keywords.contains
import future.keywords.if

default allow := false
default need_approval := false
default require_audit := false

allow if {
	input.user.role == "data_admin"
}

allow if {
	input.user.role == "engineer"
	input.dataset.classification == "internal"
}

need_approval if {
	input.dataset.classification == "PII"
	input.user.role == "analyst"
}

need_approval if {
	input.purpose == "marketing"
	input.dataset.classification == "PII"
}

mask_fields contains field if {
	some f in input.dataset.fields
	f.name == field
	f.sensitive == true
}

require_audit if {
	input.dataset.classification == "confidential"
}

reasons contains msg if {
	allow
	msg := "policy: data_admin or engineer_internal allow"
}

reasons contains msg if {
	need_approval
	input.dataset.classification == "PII"
	input.user.role == "analyst"
	msg := "policy: analyst requires approval for PII datasets"
}

reasons contains msg if {
	need_approval
	input.purpose == "marketing"
	input.dataset.classification == "PII"
	msg := "policy: marketing purpose on PII requires approval"
}

reasons contains msg if {
	require_audit
	msg := "policy: confidential classification requires audit log"
}
