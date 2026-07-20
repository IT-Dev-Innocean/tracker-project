files = [
    'src/components/ChatWorkspace/ChatSidebar.jsx',
    'src/components/ChatWorkspace/ChatHeader.jsx',
    'src/components/ChatWorkspace/ChatMessageList.jsx',
    'src/components/ChatWorkspace/ChatInputArea.jsx',
]

replacements = [
    ("from '../SharedUI'", "from '../../SharedUI'"),
    ("from '../Utils'", "from '../../Utils'"),
    ("from '../ChatMessage'", "from '../../ChatMessage'"),
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    for old, new in replacements:
        c = c.replace(old, new)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'Fixed: {fpath}')
