const express = require('express');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const port = process.env.PORT || 8080;
const parser = new Parser();

const NOTE_ID = process.env.NOTE_ID || 'ayase_tech';
// APIエンドポイント: noteのRSSを取得してJSONで返す
app.get('/api/news', async (req, res) => {
    try {
        const feedUrl = `https://note.com/${NOTE_ID}/rss`;
        const feed = await parser.parseURL(feedUrl);

        // RSSデータを表示用のフォーマットに変換
        const newsData = feed.items.map(item => {
            // 公開日を YYYY.MM.DD 形式に変換
            const date = new Date(item.pubDate);
            const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

            // RSSからラベル情報を判別（タグやカテゴリがあれば利用、なければデフォルトでinfo）
            // noteのRSSはカテゴリ情報を <category> として持っている場合があります
            let label = 'info';
            let labelName = 'お知らせ';

            // 例: タイトルやカテゴリに「リリース」が含まれていたら release にする独自のロジック
            if (item.title.includes('リリース')) {
                label = 'release';
                labelName = 'リリース';
            } else if (item.title.includes('重要')) {
                label = 'important';
                labelName = '重要';
            } else if (item.title.includes('メンテナンス')) {
                label = 'maintenance';
                labelName = 'メンテナンス';
            }

            return {
                date: formattedDate,
                label: label,
                labelName: labelName,
                title: item.title,
                url: item.link
            };
        });

        // 全件返す（ページネーションはクライアント側で処理）
        res.json(newsData);
    } catch (error) {
        console.error('RSS Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// 静的ファイルの配信 (HTML, CSS, JS, 画像など)
app.use(express.static(path.join(__dirname, '../../')));

// サーバー起動
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Target Note ID for RSS: ${NOTE_ID}`);
});
