from rules import sqli
from rules import xss

def detect_attack(payload):

	if sqli.detect_sqli(payload):
	        return "SQL Injection"
	if xss.detect_xss(payload):
		return "XXS"

	return None
