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

/* --- 3. 侧栏日志加载器 (朋友圈内联展开模式) --- */
async function loadDailyLogs() {
    const logContainer = document.getElementById('log-container');
    try {
        const response = await fetch('daily-log.md');
        const text = await response.text();
        let entries = text.split('###').map(e => e.trim()).filter(e => e !== '');
        logContainer.innerHTML = '';
        
        entries.slice(0, 5).forEach(entry => {
            const lines = entry.split('\n');
            const date = lines[0].trim();
            // 提取完整正文
            const fullContent = lines.slice(1).join('\n').trim();
            
            // 制作纯文本摘要 (将图片替换为 [图片] 字样)
            let previewText = fullContent.replace(/!\[.*?\]\(.*?\)/g, '[图片]');
            previewText = previewText.replace(/[*_#`]/g, '').substring(0, 42) + (previewText.length > 42 ? '...' : '');

            // 创建外层容器
            const div = document.createElement('div');
            div.className = 'log-note';
            
            // 创建可点击的头部（包含日期和摘要）
            const header = document.createElement('div');
            header.className = 'log-header';
            header.innerHTML = `<strong>${date}</strong><div class="log-preview">${previewText}</div>`;
            
            // 创建隐藏的完整内容区域 (调用 marked 解析器)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'log-content';
            contentDiv.style.display = 'none'; // 默认折叠
            contentDiv.innerHTML = marked.parse(fullContent);

            // 核心交互：点击切换展开/折叠状态
            header.onclick = () => {
                const isHidden = contentDiv.style.display === 'none';
                contentDiv.style.display = isHidden ? 'block' : 'none';
                // 展开时隐藏摘要，折叠时恢复摘要
                header.querySelector('.log-preview').style.display = isHidden ? 'none' : 'block';
            };

            div.appendChild(header);
            div.appendChild(contentDiv);
            logContainer.appendChild(div);
        });
    } catch (e) {
        logContainer.innerHTML = '<p>EMPTY ARCHIVE</p>';
    }
}

/* --- 4. 视图切换与正文渲染 (含字数统计算法) --- */

// 辅助函数：计算中文字数与阅读时间
function calculateReadingTime(text) {
    // 简单剥离掉 Markdown 符号，统计纯字符长度
    const cleanText = text.replace(/[*_#`\[\]()]/g, '');
    const wordCount = cleanText.length;
    // 假设中文阅读速度为 350 字/分钟
    const readTime = Math.ceil(wordCount / 350); 
    return { wordCount, readTime };
}

function showPost(markdownContent, title, date, loc, field) {
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    
    // 调用算法得出字数和时间
    const { wordCount, readTime } = calculateReadingTime(markdownContent);
    
    document.getElementById('post-header-info').innerHTML = `
        <div class="post-metadata"><span class="meta-item">${field}</span><span class="meta-item">${loc}</span><span class="meta-item">${date}</span></div>
        <h1 style="font-family: Georgia, ui-serif, 'Songti SC', 'STSong', serif; font-weight: normal; border-bottom: 2px solid #1a1a1a; padding-bottom:10px; margin-bottom: 10px;">${title}</h1>
        <div style="font-family: Consolas, Monaco, monospace; font-size: 0.75rem; color: #888; margin-bottom: 30px; letter-spacing: 1px;">
            WORDS: ${wordCount} / EST. READ: ${readTime} MIN
        </div>
    `;
    
    // 正文渲染
    document.getElementById('article-body').innerHTML = marked.parse(markdownContent);
    
    // 每次打开新文章，重置进度条并回到顶部
    document.getElementById('reading-progress').style.width = '0%';
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
    image(hrefOrToken, title, text) {
        const isToken = typeof hrefOrToken === 'object';
        const src = isToken ? hrefOrToken.href : hrefOrToken;
        const imgTitle = isToken ? hrefOrToken.title : title;
        const imgAlt = isToken ? hrefOrToken.text : text;

        const titleAttr = imgTitle ? `title="${imgTitle}"` : '';
        const altAttr = imgAlt ? `alt="${imgAlt}"` : '';
        return `<img src="${src}" ${altAttr} ${titleAttr} loading="lazy">`;
    }
};
marked.use({ renderer });

/* --- 6. 顶部阅读进度条引擎 --- */
// 凭空创建一个 div 塞进网页里，不需要你去改 index.html
const progressBar = document.createElement('div');
progressBar.id = 'reading-progress';
document.body.appendChild(progressBar);

// 监听鼠标滚动事件
window.addEventListener('scroll', () => {
    // 只有在正文页面才计算进度
    if (document.getElementById('content-view').style.display === 'block') {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        // 避免极短文章除以 0 导致报错
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        document.getElementById('reading-progress').style.width = progress + '%';
    }
});

// 启动执行
loadPosts();
loadDailyLogs();
