with open('backend/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = 'now_str = datetime.utcnow().strftime("%I:%M %p")'
repl1 = 'now_str = datetime.now(IST).strftime("%I:%M %p")'

target2 = 'timestamp=datetime.utcnow().strftime("%I:%M %p")'
repl2 = 'timestamp=datetime.now(IST).strftime("%I:%M %p")'

assert target1 in text, "target1 not found"
assert target2 in text, "target2 not found"

text = text.replace(target1, repl1)
text = text.replace(target2, repl2)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Both utcnow instances successfully replaced with datetime.now(IST)!")

