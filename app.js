// 【唯一的手工操作区】以后每次写了新文章，只需把文件名加到这个数组的最前面即可
const postFiles = ['post4.md', 'post3.md', 'post2.md', 'post1.md']; 

// --- 全局状态管理 ---
let allLogs = [];
const logsPerPage = 5; 
let currentLogPage = 1;

let allMusic = [];
let allBooks = [];
const archivePerPage = 4; // 音乐和书单每页显示 4 个
let currentMusicPage = 1;
let currentBookPage = 1;

/* --- 1. 核心档案解析器 (YAML Frontmatter Parser) --- */
function parseMarkdown(text) {
    const result = { meta: {}, content: text };
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
            
            card.onclick = () => showPost(content, title, date, loc, field, file);
            listElement.appendChild(card);
        } catch (e) { console.error(`Failed to load ${file}:`, e); }
    }
}

/* --- 3. 侧栏加载器群 (日志、音乐、书籍分页逻辑) --- */

// 通用分页渲染器 (极简翻页器模式)
function renderPagination(totalPages, currentPage, loadFn, container) {
    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'log-pagination';
    
    // 强制左右对齐布局
    paginationDiv.style.display = 'flex';
    paginationDiv.style.justifyContent = 'space-between'; 
    paginationDiv.style.alignItems = 'center';
    paginationDiv.style.width = '100%'; 

    // 1. 上一页按钮 [ ← ]
    const prevBtn = document.createElement('span');
    prevBtn.className = 'page-num';
    prevBtn.innerText = '[ ← ]';
    if (currentPage > 1) {
        prevBtn.onclick = () => loadFn(currentPage - 1);
    } else {
        prevBtn.style.visibility = 'hidden'; // 第一页时隐藏按钮，但保留它占据的空间以保持居中对称
    }
    paginationDiv.appendChild(prevBtn);

    // 2. 进度指示器 (例如：3 / 12)
    const indicator = document.createElement('span');
    indicator.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Monaco, monospace';
    indicator.style.fontSize = '0.8rem';
    indicator.style.fontWeight = 'bold';
    indicator.style.color = '#1a1a1a';
    indicator.style.letterSpacing = '2px';
    indicator.innerText = `${currentPage} / ${totalPages}`;
    paginationDiv.appendChild(indicator);

    // 3. 下一页按钮 [ → ]
    const nextBtn = document.createElement('span');
    nextBtn.className = 'page-num';
    nextBtn.innerText = '[ → ]';
    if (currentPage < totalPages) {
        nextBtn.onclick = () => loadFn(currentPage + 1);
    } else {
        nextBtn.style.visibility = 'hidden'; // 最后一页时隐藏
    }
    paginationDiv.appendChild(nextBtn);

    container.appendChild(paginationDiv);
}

    // 渲染页码和省略号
    pages.forEach(p => {
        if (p === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.style.color = '#ccc';
            ellipsis.style.letterSpacing = '2px';
            ellipsis.style.margin = '0 2px';
            ellipsis.innerText = '...';
            paginationDiv.appendChild(ellipsis);
        } else {
            const pageSpan = document.createElement('span');
            pageSpan.className = `page-num ${p === currentPage ? 'active' : ''}`;
            pageSpan.innerText = `[ ${p} ]`;
            pageSpan.onclick = () => loadFn(p);
            paginationDiv.appendChild(pageSpan);
        }
    });

    container.appendChild(paginationDiv);
}

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
        const currentLogs = allLogs.slice(startIndex, startIndex + logsPerPage);

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

        renderPagination(Math.ceil(allLogs.length / logsPerPage), currentLogPage, loadDailyLogs, logContainer);
    } catch (e) { logContainer.innerHTML = '<p>FAILED TO LOAD ARCHIVE</p>'; }
}

async function loadMusicArchive(page = 1) {
    const container = document.getElementById('music-container');
    if (!container) return;
    currentMusicPage = page;

    try {
        if (allMusic.length === 0) {
            const response = await fetch('music.md');
            if (!response.ok) throw new Error("File not found");
            const text = await response.text();
            // 按照 ### 切割，并把 ### 补回去以便 marked 渲染
            allMusic = text.split('###').map(e => e.trim()).filter(e => e !== '').map(e => '### ' + e);
        }

        const startIndex = (currentMusicPage - 1) * archivePerPage;
        const currentItems = allMusic.slice(startIndex, startIndex + archivePerPage);
        
        container.innerHTML = marked.parse(currentItems.join('\n\n'));
        renderPagination(Math.ceil(allMusic.length / archivePerPage), currentMusicPage, loadMusicArchive, container);

    } catch (e) { container.innerHTML = '<p style="font-size: 0.8rem; color:#666;">档案未建立: music.md</p>'; }
}

async function loadBookArchive(page = 1) {
    const container = document.getElementById('books-container');
    if (!container) return;
    currentBookPage = page;

    try {
        if (allBooks.length === 0) {
            const response = await fetch('books.md');
            if (!response.ok) throw new Error("File not found");
            const text = await response.text();
            allBooks = text.split('###').map(e => e.trim()).filter(e => e !== '').map(e => '### ' + e);
        }

        const startIndex = (currentBookPage - 1) * archivePerPage;
        const currentItems = allBooks.slice(startIndex, startIndex + archivePerPage);
        
        container.innerHTML = marked.parse(currentItems.join('\n\n'));
        renderPagination(Math.ceil(allBooks.length / archivePerPage), currentBookPage, loadBookArchive, container);

    } catch (e) { container.innerHTML = '<p style="font-size: 0.8rem; color:#666;">档案未建立: books.md</p>'; }
}

/* --- 4. 渲染引擎 --- */
function showAbout() {
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    
    document.getElementById('post-header-info').innerHTML = `
        <div class="post-metadata">
            <span class="meta-item">PROFILE</span>
            <span class="meta-item">SHENZHEN</span>
            <span class="meta-item">2026</span>
        </div>
        <h1 style="font-family: Georgia, ui-serif, serif; font-weight: normal; border-bottom: 2px solid #1a1a1a; padding-bottom:10px; margin-bottom: 30px;">ABOUT ME</h1>
    `;

    const aboutMarkdown = `# Abel\n\n一点自己的想法。\n\n目前在广州/深圳。\n\n音乐/社会/自我`;
    
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

    // 触发音乐和书单的加载器（自动带分页）
    loadMusicArchive(1);
    loadBookArchive(1);
}

function calculateReadingTime(text) {
    const cleanText = text.replace(/[*_#`\[\]()]/g, '');
    const wordCount = cleanText.length;
    return { wordCount, readTime: Math.ceil(wordCount / 350) };
}

function showPost(markdownContent, title, date, loc, field, fileName) {
    document.getElementById('index-view').style.display = 'none';
    document.getElementById('content-view').style.display = 'block';
    
    const { wordCount, readTime } = calculateReadingTime(markdownContent);
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
        <h1 style="font-family: Georgia, ui-serif, serif; font-weight: normal; border-bottom: 2px solid #1a1a1a; padding-bottom:10px; margin-bottom: 10px;">${title}</h1>
        <div style="font-family: Consolas, monospace; font-size: 0.75rem; color: #888; margin-bottom: 30px; letter-spacing: 1px;">
            WORDS: ${wordCount} / EST. READ: ${readTime} MIN
        </div>
    `;
    
    document.getElementById('article-body').innerHTML = marked.parse(markdownContent);
    window.scrollTo(0, 0);
}

async function switchLanguage(targetFile) {
    try {
        const response = await fetch(`posts/${targetFile}`);
        if (!response.ok) return alert("Translation file not found in archive.");
        const text = await response.text();
        const { meta, content } = parseMarkdown(text);
        showPost(content, meta.title || targetFile, meta.date || '2026', meta.location || 'SZ', meta.category || meta.field || 'GENERAL', targetFile);
    } catch (e) { console.error("Language switch failed:", e); }
}

function showIndex() {
    document.getElementById('index-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';
    window.scrollTo(0, 0);
}

/* --- 5. Markdown 图片渲染器 --- */
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
