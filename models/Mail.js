import fs from 'node:fs';
import path from 'node:path';
import { simpleParser } from 'mailparser';

const mailDir = path.join(process.env.HOME, 'Maildir/new');

function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
}

export async function getEmails() {
    if (!fs.existsSync(mailDir)) fs.mkdirSync(mailDir, { recursive: true });
    const files = fs.readdirSync(mailDir);
    const emails = [];

    for (const file of files) {
        try {
            const rawEmail = fs.readFileSync(path.join(mailDir, file));
            const parsed = await simpleParser(rawEmail);
            emails.push({
                id: file,
                from: parsed.from?.text || 'Unknown',
                subject: parsed.subject || '(Без темы)',
                text: linkify(parsed.text || "")
            });
        } catch (e) { 
            console.error("Ошибка парсинга:", file); 
        }
    }
    return emails;
}

export function deleteEmail(filename) {
    const filePath = path.join(mailDir, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

export function getHtmlTemplate(port) {
    return `
    <html>
        <head>
            <title>WSL Mailer</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 20px auto; background: #f0f2f5; }
                .card { background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .content { background: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #eee; margin-top: 10px; white-space: pre-wrap; font-family: monospace; }
                .btn-del { background: #ff4d4f; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; float: right; }
                .btn-del:hover { background: #ff7875; }
                h1 { color: #1a1a1a; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1>📬 WSL Почта</h1>
            <div id="status" style="margin-bottom: 10px; color: #666;"></div>
            <div id="list">Загрузка...</div>

            <script>
                let lastCount = -1;
                let alertInterval = null;
                const originalTitle = "WSL Mailer";

                // Функция мигания заголовка
                function startAlert() {
                    if (alertInterval) return;
                    let flip = false;
                    alertInterval = setInterval(() => {
                        document.title = flip ? "!!! НОВОЕ ПИСЬМО !!!" : "📩 Почта пришла!";
                        flip = !flip;
                    }, 1000);
                }

                function stopAlert() {
                    clearInterval(alertInterval);
                    alertInterval = null;
                    document.title = originalTitle;
                }

                // Остановка уведомления при клике в любом месте страницы
                window.onfocus = stopAlert;
                window.onclick = stopAlert;

                async function load() {
                    try {
                        const res = await fetch('/api/mail/emails');
                        const mails = await res.json();
                        
                        // Если писем стало больше, чем было — сигнализируем
                        if (lastCount !== -1 && mails.length > lastCount) {
                            startAlert();
                        }
                        lastCount = mails.length;

                        const list = document.getElementById('list');
                        document.getElementById('status').innerText = "Обновлено: " + new Date().toLocaleTimeString();

                        if (mails.length === 0) {
                            list.innerHTML = '<p>Почтовый ящик пуст.</p>';
                            return;
                        }
                        list.innerHTML = mails.map(m => \`
                            <div class="card" id="card-\${m.id}">
                                <button class="btn-del" onclick="del('\${m.id}')">Удалить</button>
                                <strong>От:</strong> \${m.from}<br>
                                <strong>Тема:</strong> \${m.subject}
                                <div class="content">\${m.text}</div>
                            </div>
                        \`).join('');
                    } catch (e) {
                        console.error("Ошибка загрузки:", e);
                    }
                }

                async function del(id) {
                    
                        const res = await fetch('/api/mail/emails/delete/' + id, { method: 'DELETE' });
                        if (res.ok) {
                            document.getElementById('card-' + id).remove();
                            lastCount--; // Уменьшаем счетчик, чтобы не сработало уведомление
                        }
                    
                }

                setInterval(load, 5000); // Проверка каждые 5 секунд для большей отзывчивости
                load();
            </script>
        </body>
    </html>`;
}

