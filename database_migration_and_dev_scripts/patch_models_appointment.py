with open('backend/models.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = """    is_dependent: bool = Field(default=False)
    is_arrived: bool = Field(default=False)"""

repl = """    is_dependent: bool = Field(default=False)
    is_arrived: bool = Field(default=False)
    predicted_duration: Optional[int] = Field(default=30)
    symptoms: Optional[str] = Field(default=None)"""

def replace_code(target, replacement, code):
    if target in code:
        return code.replace(target, replacement, 1)
    elif target.replace('\n', '\r\n') in code:
        return code.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)
    return code

text = replace_code(target, repl, text)

with open('backend/models.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("backend/models.py updated successfully!")
