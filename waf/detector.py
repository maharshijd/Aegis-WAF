from rules import sqli
from rules import xss
from rules import ssti

def detect_attack(payload):

	if sqli.detect_sqli(payload):
	        return "SQL Injection"
	if xss.detect_xss(payload):
		return "XXS"
	if ssti.detect_ssti(payload):
		return "SSTI"

	return None
