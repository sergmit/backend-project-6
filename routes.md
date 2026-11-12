# Маршруты

Регистрация: все контроллеры подключаются в `server/routes/index.js`
(массив `controllers`). Имена маршрутов доступны через `app.reverse(name)`
и в шаблонах через `route(name)`.

## Приложение

| Метод | Путь | Имя | Описание | Файл |
|-------|------|-----|----------|------|
| GET | `/` | `root` | Главная страница, рендер `welcome/index` | `server/routes/welcome.js:4` |
| GET | `/users/new` | `newUser` | Форма регистрации `users/new` | `server/routes/users.js:39` |
| POST | `/users` | `createUser` | Валидация и создание пользователя → `/sessions/new` | `server/routes/users.js:42` |
| GET | `/users` | `users` | Публичный список пользователей `users/index` | `server/routes/users.js:81` |
| DELETE | `/users/:id` | `deleteUser` | Удаление пользователя (только для авторизованных) → `/users` | `server/routes/users.js:86` |
| GET | `/users/:id` | `showUser` | Профиль пользователя `users/show` (только свой) | `server/routes/users.js:110` |
| GET | `/users/:id/edit` | `editUser` | Форма редактирования `users/edit` (только свой) | `server/routes/users.js:131` |
| PATCH | `/users/:id` | `updateUser` | Обновление профиля (только свой) → `/users/:id` | `server/routes/users.js:152` |
| GET | `/sessions/new` | `newSession` | Форма входа `session/new` | `server/routes/session.js:7` |
| POST | `/sessions` | `createSession` | Аутентификация (passport form) → `/` | `server/routes/session.js:11` |
| DELETE | `/session` | `deleteSession` | Выход из системы (только для авторизованных) → `/` | `server/routes/session.js:25` |
| GET | `/statuses` | `statuses` | Список статусов `statuses/index` (только для авторизованных) | `server/routes/statuses.js:26` |
| GET | `/statuses/new` | `newStatus` | Форма создания статуса `statuses/new` (только для авторизованных) | `server/routes/statuses.js:34` |
| POST | `/statuses` | `createStatus` | Валидация и создание статуса → `/statuses` (только для авторизованных) | `server/routes/statuses.js:41` |
| GET | `/statuses/:id/edit` | `editStatus` | Форма редактирования статуса `statuses/edit` (только для авторизованных) | `server/routes/statuses.js:59` |
| PATCH | `/statuses/:id` | `updateStatus` | Обновление статуса → `/statuses` (только для авторизованных) | `server/routes/statuses.js:74` |
| DELETE | `/statuses/:id` | `deleteStatus` | Удаление статуса → `/statuses` (только для авторизованных) | `server/routes/statuses.js:103` |
| GET | `/labels` | `labels` | Список меток `labels/index` (только для авторизованных) | `server/routes/labels.js:26` |
| GET | `/labels/new` | `newLabel` | Форма создания метки `labels/new` (только для авторизованных) | `server/routes/labels.js:34` |
| POST | `/labels` | `createLabel` | Валидация и создание метки → `/labels` (только для авторизованных) | `server/routes/labels.js:41` |
| GET | `/labels/:id/edit` | `editLabel` | Форма редактирования метки `labels/edit` (только для авторизованных) | `server/routes/labels.js:59` |
| PATCH | `/labels/:id` | `updateLabel` | Обновление метки → `/labels` (только для авторизованных) | `server/routes/labels.js:74` |
| DELETE | `/labels/:id` | `deleteLabel` | Удаление метки → `/labels` (только для авторизованных) | `server/routes/labels.js:103` |
| GET | `/tasks` | `tasks` | Список задач `tasks/index` (только для авторизованных) | `server/routes/tasks.js:145` |
| GET | `/tasks/new` | `newTask` | Форма создания задачи `tasks/new` (только для авторизованных) | `server/routes/tasks.js:146` |
| POST | `/tasks` | `createTask` | Валидация и создание задачи → `/tasks` (только для авторизованных) | `server/routes/tasks.js:151` |
| GET | `/tasks/:id` | `showTask` | Просмотр задачи `tasks/show` (только для авторизованных) | `server/routes/tasks.js:156` |
| GET | `/tasks/:id/edit` | `editTask` | Форма редактирования задачи `tasks/edit` (только для авторизованных) | `server/routes/tasks.js:161` |
| PATCH | `/tasks/:id` | `updateTask` | Обновление задачи → `/tasks` (только для авторизованных) | `server/routes/tasks.js:166` |
| DELETE | `/tasks/:id` | `deleteTask` | Удаление задачи → `/tasks` (только для авторизованных) | `server/routes/tasks.js:171` |

## Статические файлы

`@fastify/static`: `dist/` отдаётся по префиксу `/assets/`
(`server/index.js:51-54`).

## Правило поддержки

При добавлении, изменении или удалении маршрута в `server/routes/`
обновляйте таблицу выше (метод, путь, имя, описание, файл:строка).
