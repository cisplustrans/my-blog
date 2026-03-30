// 【唯一的手工操作区】以后每次写了新文章，只需把文件名加到这个数组的最前面即可
const postFiles = ['post4.md', 'post3.md', 'post2.md', 'post1.md']; 
let allLogs = [];
const logsPerPage = 5; 
let currentLogPage = 1;

/* --- 1. 核心档案解析器 (YAML Frontmatter Parser) --- */
function parseMarkdown(text) {
    const result = { meta: {}, content: text };
    
    // 升级版切割雷达：完美兼容 Windows 换行符(\r\n) 和文件开头的隐形空格(BOM)
    const match = text.match(/^\s*---\r?\n([\s\S]*?)\r?\n---/);

    if (match) {
        const metaText = match[1];
        result.content = text.slice(match[0].length).trim(); 

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
            if (!response.ok) continue; 
            const text = await response.text();

            const { meta, content } = parseMarkdown(text);

            const title = meta.title || file;
            const date = meta.date || '2026';
            const loc = meta.location || 'SZ';
            const field = meta.category || meta.field || 'GENERAL';
            const description = meta.excerpt || meta.description || '';

            if (filterField && field.toUpperCase() !== filterField.toUpperCase()) continue;

            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <div class="post-metadata"><span class="meta-item">${field}</span><span class="meta-item">${loc}</span></div>
                <h2>${title}</h2>
                <p class="post-excerpt">${description}</p>
                <div class="post-metadata" style="background:none; color:#999;">DATE: ${date}</div>
            `;
            
            // 【关键修改】这里增加了 file 参数，告诉渲染器现在读的是哪个文件
            card.onclick = () => showPost(content, title, date, loc, field, file);
            listElement.appendChild(card);
        } catch (e) { console.error(`Failed to load ${file}:`, e); }
    }
}

/* --- 3. 侧栏日志加载器 (支持分页) --- */
async function loadDailyLogs(page = 1) {
    const logContainer = document.getElementById('log-container');
    currentLogPage = page; 

    try {
        if (allLogs.length === 0) {
            const response = await fetch('daily-log.md');
            if (!response.ok) throw new Error("Log file not found");
            const text = await response.text();
            allLogs = text.split('###').map(e => e.trim()).filter(e => e !== '');
        }

        if (allLogs.length === 0) {
            logContainer.innerHTML = '<p>EMPTY ARCHIVE</p>';
            return;
        }

        const startIndex = (currentLogPage - 1) * logsPerPage;
        const endIndex = startIndex + logsPerPage;
        const currentLogs = allLogs.slice(startIndex, endIndex);

        logContainer.innerHTML = ''; 

        currentLogs.forEach(entry => {
            const lines = entry.split('\n');
            const date = lines[0].trim();
            const fullContent = lines.slice(1).join('\n').trim();
            
            let previewText = fullContent.replace(/!\[.*?\]\(.*?\)/g, '[图片]');
            previewText = previewText.replace(/[*_#`]/g, '').substring(0, 42) + (previewText.length > 42 ? '...' : '');

            const div = document.createElement('div');
            div.className = 'log-note';
            
            const header = document.createElement('div');
            header.className = 'log-header';
            header.innerHTML = `<strong>${date}</strong><div class="log-preview">${previewText}</div>`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'log-content';
            contentDiv.style.display = 'none'; 
            contentDiv.innerHTML = marked.parse(fullContent);

            header.onclick = () => {
                const isHidden = contentDiv.style.display === 'none';
                contentDiv.style.display = isHidden ? 'block' : 'none';
                header.querySelector('.log-preview').style.display = isHidden ? 'none' : 'block';
            };

            div.appendChild(header);
            div.appendChild(contentDiv);
            logContainer.appendChild(div);
        });

        // 渲染分页控件
        const totalPages = Math.ceil(allLogs.length / logsPerPage);
        if (totalPages > 1) {
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'log-pagination';
            for (let i = 1; i <= totalPages; i++) {
                const pageSpan = document.createElement('span');
                pageSpan.className = `page-num ${i === currentLogPage ? 'active' : ''}`;
                pageSpan.innerText = `[ ${i} ]`;
                pageSpan.onclick = () => loadDailyLogs(i);
                paginationDiv.appendChild(pageSpan);
            }
            logContainer.appendChild(paginationDiv);
        }

    } catch (e) {
        logContainer.innerHTML = '<p>FAILED TO LOAD ARCHIVE</p>';
    }
}

/* --- 全新的 showAbout 渲染引擎 (引入左右双栏排版) --- */
async function showAbout() {
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    
    // 渲染 ABOUT 顶部的 Header
    document.getElementById('post-header-info').innerHTML = `
        <div class="post-metadata">
            <span class="meta-item">PROFILE</span>
            <span class="meta-item">SHENZHEN</span>
            <span class="meta-item">2026</span>
        </div>
        <h1 style="font-family: Georgia, ui-serif, 'Songti SC', 'STSong', serif; font-weight: normal; border-bottom: 2px solid #1a1a1a; padding-bottom:10px; margin-bottom: 30px;">ABOUT ME</h1>
    `;

    // 这里是你的左侧主内容
    const aboutMarkdown = `# Abel\n\n一点自己的想法。\n\n目前在广州/深圳。\n\n音乐/社会/自我`;
    
    // 借用主页的 layout-grid 结构，构建双栏布局
    const layoutHTML = `
        <div class="layout-grid">
            <div class="about-main">
                ${marked.parse(aboutMarkdown)}
            </div>
            <aside class="sidebar-log sidebar-about">
                <h3 class="sidebar-title">MUSIC ARCHIVE</h3>
                <div id="music-container" class="archive-container"><span style="color:#666; font-family: monospace;">[ PULLING DATA... ]</span></div>
                
                <div style="margin-top: 40px;"></div>
                
                <h3 class="sidebar-title">BOOK ARCHIVE</h3>
                <div id="books-container" class="archive-container"><span style="color:#666; font-family: monospace;">[ PULLING DATA... ]</span></div>
            </aside>
        </div>
    `;
    
    document.getElementById('article-body').innerHTML = layoutHTML;
    window.scrollTo(0, 0);

    // 异步加载音乐和书单文件到右侧边栏
    try {
        const musicRes = await fetch('music.md');
        if(musicRes.ok) document.getElementById('music-container').innerHTML = marked.parse(await musicRes.text());
        else document.getElementById('music-container').innerHTML = '<p>档案建立中...</p>';
    } catch(e) {}
    
    try {
        const bookRes = await fetch('books.md');
        if(bookRes.ok) document.getElementById('books-container').innerHTML = marked.parse(await bookRes.text());
        else document.getElementById('books-container').innerHTML = '<p>档案建立中...</p>';
    } catch(e) {}
}

/* --- 4. 视图切换与正文渲染 (支持镜像语言切换) --- */

function calculateReadingTime(text) {
    const cleanText = text.replace(/[*_#`\[\]()]/g, '');
    const wordCount = cleanText.length;
    const readTime = Math.ceil(wordCount / 350); 
    return { wordCount, readTime };
}

// 【关键修改】增加了 fileName 参数，用于判断中英文
function showPost(markdownContent, title, date, loc, field, fileName) {
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    
    const { wordCount, readTime } = calculateReadingTime(markdownContent);
    
    // 语言切换逻辑：判断当前文件，计算出镜像文件名
    const isEn = fileName.includes('_en.md');
    const targetFile = isEn ? fileName.replace('_en.md', '.md') : fileName.replace('.md', '_en.md');
    const toggleLabel = isEn ? '[ 中 ]' : '[ EN ]';

    document.getElementById('post-header-info').innerHTML = `
        <div class="post-metadata">
            <span class="meta-item">${field}</span>
            <span class="meta-item">${loc}</span>
            <span class="meta-item">${date}</span>
            ${fileName !== 'ABOUT' ? `<span class="lang-toggle" onclick="switchLanguage('${targetFile}')">${toggleLabel}</span>` : ''}
        </div>
        <h1 style="font-family: Georgia, ui-serif, 'Songti SC', 'STSong', serif; font-weight: normal; border-bottom: 2px solid #1a1a1a; padding-bottom:10px; margin-bottom: 10px;">${title}</h1>
        <div style="font-family: Consolas, Monaco, monospace; font-size: 0.75rem; color: #888; margin-bottom: 30px; letter-spacing: 1px;">
            WORDS: ${wordCount} / EST. READ: ${readTime} MIN
        </div>
    `;
    
    document.getElementById('article-body').innerHTML = marked.parse(markdownContent);
    window.scrollTo(0, 0);
}

// 【新增函数】专门负责在不刷新页面的情况下读取另一个语言版本
async function switchLanguage(targetFile) {
    try {
        const response = await fetch(`posts/${targetFile}`);
        if (!response.ok) {
            alert("Translation file not found in archive.");
            return;
        }
        const text = await response.text();
        const { meta, content } = parseMarkdown(text);
        
        const title = meta.title || targetFile;
        const date = meta.date || '2026';
        const loc = meta.location || 'SZ';
        const field = meta.category || meta.field || 'GENERAL';
        
        // 重新调用 showPost 渲染新的内容
        showPost(content, title, date, loc, field, targetFile);
    } catch (e) {
        console.error("Language switch failed:", e);
    }
}

function showIndex() {
    document.getElementById('index-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';
    window.scrollTo(0, 0);
}

function showAbout() {
    // About 页面传一个标记，防止显示语言切换
    showPost('# Abel\n\n一点自己的想法。\n\n目前在广州/深圳。\n\n音乐/社会/自我', 'ABOUT ME', '2026', 'SHENZHEN', 'PROFILE', 'ABOUT');
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

// 启动执行
loadPosts();
loadDailyLogs();
