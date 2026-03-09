const postFiles = ['post3.md','post2.md', 'post1.md']; 

async function loadPosts(filterField = null) {
    showIndex();
    const listElement = document.getElementById('post-list');
    listElement.innerHTML = '';

    for (const file of postFiles) {
        try {
            const response = await fetch(`posts/${file}`);
            const text = await response.text();
            const title = extractMeta(text, 'title') || file;
            const date = extractMeta(text, 'date') || '2026';
            const loc = extractMeta(text, 'location') || 'SZ';
            const field = extractMeta(text, 'field') || 'GENERAL';
            const description = extractMeta(text, 'description') || '';

            if (filterField && field.toUpperCase() !== filterField.toUpperCase()) continue;

            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-metadata"><span class="meta-item">${field}</span><span class="meta-item">${loc}</span></div>
                <h2>${title}</h2>
                <p class="post-excerpt">${description}</p>
                <div class="post-metadata" style="background:none; color:#999;">DATE: ${date}</div>
            `;
            card.onclick = () => showPost(text, title, date, loc, field);
            listElement.appendChild(card);
        } catch (e) { console.error(e); }
    }
}

async function loadDailyLogs() {
    const logContainer = document.getElementById('log-container');
    try {
        const response = await fetch('daily-log.md');
        const text = await response.text();
        let entries = text.split('###').map(e => e.trim()).filter(e => e !== '');
        logContainer.innerHTML = '';
        entries.slice(0, 4).forEach(entry => {
            const lines = entry.split('\n');
            const date = lines[0].trim();
            const content = lines.slice(1).join('<br>').trim();
            const div = document.createElement('div');
            div.className = 'log-note';
            div.innerHTML = `<strong>${date}</strong>${content}`;
            logContainer.appendChild(div);
        });
    } catch (e) {
        logContainer.innerHTML = '<p>EMPTY ARCHIVE</p>';
    }
}

function extractMeta(text, key) {
    const regex = new RegExp(`${key}:\\s*(.*)`);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}

function showPost(markdown, title, date, loc, field) {
    const content = markdown.split('---').slice(2).join('---');
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    document.getElementById('post-header-info').innerHTML = `
        <div class="post-metadata"><span class="meta-item">${field}</span><span class="meta-item">${loc}</span><span class="meta-item">${date}</span></div>
        <h1 style="font-family: Georgia, serif; border-bottom: 2px solid #333; padding-bottom:10px;">${title}</h1>
    `;
    document.getElementById('article-body').innerHTML = marked.parse(content);
    window.scrollTo(0, 0);
}

function showIndex() {
    document.getElementById('index-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';
    window.scrollTo(0, 0);
}

function showAbout() {
    showPost('---\n---\n# ABO\n\n一点自己的想法。\n\n目前在广州/深圳。音乐/社会/宏观经济', 'ABOUT ME', '2026', 'SHENZHEN', 'PROFILE');
}

// 启动执行
loadPosts();
loadDailyLogs();
