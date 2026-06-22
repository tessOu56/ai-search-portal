package access_test

import data.access

test_data_admin_allow if {
	decision := access with input as {
		"user": {"role": "data_admin"},
		"purpose": "analytics",
		"dataset": {
			"classification": "PII",
			"fields": [{"name": "email", "sensitive": true}],
		},
	}
	decision.allow == true
	decision.need_approval == false
}

test_analyst_pii_need_approval if {
	decision := access with input as {
		"user": {"role": "analyst"},
		"purpose": "analytics",
		"dataset": {
			"classification": "PII",
			"fields": [{"name": "email", "sensitive": true}],
		},
	}
	decision.allow == false
	decision.need_approval == true
	count(decision.mask_fields) == 1
}

test_marketing_pii_need_approval if {
	decision := access with input as {
		"user": {"role": "engineer"},
		"purpose": "marketing",
		"dataset": {
			"classification": "PII",
			"fields": [
				{"name": "email", "sensitive": true},
				{"name": "phone", "sensitive": true},
			],
		},
	}
	decision.need_approval == true
	count(decision.mask_fields) == 2
}

test_confidential_audit if {
	decision := access with input as {
		"user": {"role": "data_admin"},
		"purpose": "analytics",
		"dataset": {
			"classification": "confidential",
			"fields": [],
		},
	}
	decision.require_audit == true
}
