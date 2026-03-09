// 【唯一的手工操作区】以后每次写了新文章，只需把文件名加到这个数组的最前面即可
const postFiles = ['post4.md', 'post3.md', 'post2.md', 'post1.md']; 

/* --- 1. 核心档案解析器 (YAML Frontmatter Parser) --- */
function parseMarkdown(text) {
    const result = { meta: {}, content: text };
    
    // 升级版切割雷达：完美兼容 Windows 换行符(\r\n) 和文件开头的隐形空格(BOM)
    const match = text.match(/^\s*---\r?\n([\s\S]*?)\r?\n---/);

    if (match) {
        const metaText = match[1];
        // 切割完成后，将剩余的所有内容安全地划归为正文
        result.content = text.slice(match[0].length).trim(); 

        // 自动解析属性（兼容大小写和空格）
        metaText.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                const key = line.slice(0, colonIndex).trim().toLowerCase();
                const value = line.slice(colonIndex + 1).trim();
                result.meta[key] = value;
            }
        });
    }
    return result;
}

/* --- 2. 自动化生成首页列表 --- */
async function loadPosts(filterField = null) {
    showIndex();
    const listElement = document.getElementById('post-list');
    listElement.innerHTML = '';

    for (const file of postFiles) {
        try {
            const response = await fetch(`posts/${file}`);
            if (!response.ok) continue; // 容错：遇到空文件自动跳过
            const text = await response.text();

            // 召唤解析器，分离皮囊与血肉
            const { meta, content } = parseMarkdown(text);

            // 智能读取（兼容你以前的写法，如果没有填就给一个默认值）
            const title = meta.title || file;
            const date = meta.date || '2026';
            const loc = meta.location || 'SZ';
            const field = meta.category || meta.field || 'GENERAL';
            const description = meta.excerpt || meta.description || '';

            // 分类筛选逻辑
            if (filterField && field.toUpperCase() !== filterField.toUpperCase()) continue;

            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-metadata"><span class="meta-item">${field}</span><span class="meta-item">${loc}</span></div>
                <h2>${title}</h2>
                <p class="post-excerpt">${description}</p>
                <div class="post-metadata" style="background:none; color:#999;">DATE: ${date}</div>
            `;
            
            // 绑定点击事件，将纯净的正文传给渲染器
            card.onclick = () => showPost(content, title, date, loc, field);
            listElement.appendChild(card);
        } catch (e) { console.error(`Failed to load ${file}:`, e); }
    }
}

/* --- 3. 侧栏日志加载器 --- */
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

/* --- 4. 视图切换与正文渲染 --- */
function showPost(markdownContent, title, date, loc, field) {
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    
    document.getElementById('post-header-info').innerHTML = `
        <div class="post-metadata"><span class="meta-item">${field}</span><span class="meta-item">${loc}</span><span class="meta-item">${date}</span></div>
        <h1 style="font-family: Georgia, ui-serif, 'Songti SC', 'STSong', serif; font-weight: normal; border-bottom: 2px solid #1a1a1a; padding-bottom:10px; margin-bottom: 30px;">${title}</h1>
    `;
    
    // 正文渲染
    document.getElementById('article-body').innerHTML = marked.parse(markdownContent);
    window.scrollTo(0, 0);
}

function showIndex() {
    document.getElementById('index-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';
    window.scrollTo(0, 0);
}

function showAbout() {
    showPost('# Abo\n\n一点自己的想法。\n\n目前在广州/深圳。音乐/社会/宏观经济', 'ABOUT ME', '2026', 'SHENZHEN', 'PROFILE');
}

/* --- 5. Markdown 渲染引擎高级配置 (拦截器) --- */
const renderer = {
    // 拦截图片生成过程，强制注入 loading="lazy"
    image(href, title, text) {
        const titleAttr = title ? `title="${title}"` : '';
        const altAttr = text ? `alt="${text}"` : '';
        return `<img src="${href}" ${altAttr} ${titleAttr} loading="lazy">`;
    }
};
marked.use({ renderer });

// 启动执行
loadPosts();
loadDailyLogs();
