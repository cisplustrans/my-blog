const assert = require('node:assert/strict');
const test = require('node:test');

const {
    calculateReadingTime,
    clampPage,
    escapeAttr,
    escapeHtml,
    parseMarkdown,
    renderer,
} = require('../app.js');

test('parseMarkdown extracts frontmatter values without truncating colons in values', () => {
    const source = `---\ntitle: A title: with a colon\nFIELD: Viewpoints\n---\n\nBody text`;

    const parsed = parseMarkdown(source);

    assert.deepEqual(parsed.meta, {
        title: 'A title: with a colon',
        field: 'Viewpoints',
    });
    assert.equal(parsed.content, 'Body text');
});

test('clampPage keeps archive page requests inside available bounds', () => {
    assert.equal(clampPage(0, 11, 5), 1);
    assert.equal(clampPage(99, 11, 5), 3);
    assert.equal(clampPage('2', 11, 5), 2);
    assert.equal(clampPage('not-a-page', 11, 5), 1);
    assert.equal(clampPage(7, 0, 5), 1);
});

test('HTML and attribute escaping neutralizes unsafe metadata and image text', () => {
    assert.equal(escapeHtml(`<script>alert('x')</script>`), '&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;');
    assert.equal(escapeAttr('`quoted` & "double"'), '&#96;quoted&#96; &amp; &quot;double&quot;');

    const html = renderer.image('photo" onerror="alert(1)', 'bad" title', 'alt <tag>');
    assert.equal(html, '<img src="photo&quot; onerror=&quot;alert(1)" alt="alt &lt;tag&gt;" title="bad&quot; title" loading="lazy">');
});

test('calculateReadingTime reports character count and rounded reading minutes', () => {
    const markdown = '# 标题\n' + '字'.repeat(351);

    assert.deepEqual(calculateReadingTime(markdown), {
        wordCount: 355,
        readTime: 2,
    });
});
