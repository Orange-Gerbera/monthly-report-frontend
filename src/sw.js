// sw.js

self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received:', event.data.text()); // これを追加
  if (!event.data) return;

  // JSONとしてパース
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: '通知', body: event.data.text() };
  }

  const title = data.title || '月報システム';
  const options = {
    body: data.body || '',
    icon: '/assets/icons/file-192x192.png', // パスが正しいか確認してください
    badge: '/assets/icons/badge-72x72.png', // Android等のステータスバー用
    data: {
      url: data.url || '/reports' 
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  // 通知を閉じる
  event.notification.close();

  // pushイベント時に options.data に入れたURLを取得
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // 既に同じURLを開いているタブがあればそこにフォーカス
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // なければ新しいウィンドウで開く
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});