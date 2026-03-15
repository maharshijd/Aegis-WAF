import re
import urllib.parse


def normalize_input(text):
    text = urllib.parse.unquote(text)

    # normalize template spacing tricks
    text = re.sub(r"\$\{ifs\}", " ", text, flags=re.IGNORECASE)

    # replace comments with space
    text = re.sub(r"/\*.*?\*/", " ", text)

    return text.lower()


ssti_pattern = re.compile(
r"(\{\{.*?\}\}"                         # {{ ... }} (Jinja2, Twig)
r"|\{%\s*.*?\s*%\}"                     # {% ... %} (Jinja2 blocks)
r"|\$\{.*?\}"                           # ${ ... } (Freemarker, JSP)
r"|#\{.*?\}"                            # #{ ... } (Thymeleaf)
r"|<%=?\s*.*?\s*%>"                     # <% ... %> or <%= ... %> (JSP/ERB)
r"|@\{.*?\}"                            # @{ ... } (Razor)
r"|@\(.+?\)"                            # @( ... )

# universal SSTI polyglot
r"|\$\{\{<%[%\'\"}}%\\\."

# math expressions used in detection
r"|\{\{\s*\d+\s*[\*\+\-\/]\s*\d+\s*\}\}"
r"|\$\{\s*\d+\s*[\*\+\-\/]\s*\d+\s*\}"
r"|#\{\s*\d+\s*[\*\+\-\/]\s*\d+\s*\}"

# error based detection
r"|\(1\s*/\s*0\)"

# python template engines
r"|__globals__"
r"|__mro__"
r"|__subclasses__"
r"|self\.__init__"
r"|cycler\.__init__"
r"|config\.items"
r"|request\."
r"|os\.system"
r"|subprocess\."
r"|popen\("

# java template engines
r"|runtime\.getruntime"
r"|processbuilder"
r"|class\.forname"
r"|t\(java\.lang\.runtime\)"
r"|freemarker\.template"
r"|velocity\.engine"

# node template engines
r"|require\("
r"|process\.mainmodule"

# ruby template engines
r"|kernel\.system"
r"|open\("
r")",
re.IGNORECASE
)


def detect_ssti(text):
    normalized = normalize_input(text)
    return bool(ssti_pattern.search(normalized))

'''
print(detect_ssti("{{request['application']['\x5f\x5fglobals\x5f\x5f']['\x5f\x5fbuiltins\x5f\x5f']['\x5f\x5fimport\x5f\x5f']('os')['popen']('id')['read']()}}"))                                # True
print(detect_ssti("${7*7}"))                                 # True
print(detect_ssti("#{7*7}"))                                 # True
print(detect_ssti("<%= 7*7 %>"))                             # True
print(detect_ssti("{{self.__init__.__globals__}}"))          # True
print(detect_ssti("${T(java.lang.Runtime).getRuntime()}"))   # True
print(detect_ssti("${{<%[%\"'}}%\\."))                       # True
print(detect_ssti("hello world {7*7}"))                            # False
'''