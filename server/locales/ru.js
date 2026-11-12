// @ts-check

export default {
	translation: {
		appName: "Fastify Шаблон",
		flash: {
			session: {
				create: {
					success: "Вы залогинены",
					error: "Неправильный емейл или пароль",
				},
				delete: {
					success: "Вы разлогинены",
				},
			},
			users: {
				create: {
					error: "Не удалось зарегистрировать",
					success: "Пользователь успешно зарегистрирован",
				},
				update: {
					success: "Пользователь успешно обновлён",
				},
				delete: {
					success: "Пользователь успешно удалён",
				},
			},
			statuses: {
				create: {
					success: "Статус успешно создан",
					error: "Не удалось создать статус",
				},
				update: {
					success: "Статус успешно изменён",
					error: "Не удалось изменить статус",
				},
				delete: {
					success: "Статус удалён",
				},
			},
			labels: {
				create: {
					success: "Метка успешно создана",
					error: "Не удалось создать метку",
				},
				update: {
					success: "Метка успешно изменена",
					error: "Не удалось изменить метку",
				},
				delete: {
					success: "Метка удалена",
				},
			},
			tasks: {
				create: {
					success: "Задача успешно создана",
					error: "Не удалось создать задачу",
				},
				update: {
					success: "Задача успешно изменена",
					error: "Не удалось изменить задачу",
				},
				delete: {
					success: "Задача удалена",
				},
			},
			authError: "Доступ запрещён! Пожалуйста, авторизируйтесь.",
		},
		layouts: {
			application: {
				users: "Пользователи",
				statuses: "Статусы",
				labels: "Метки",
				tasks: "Задачи",
				signIn: "Вход",
				signUp: "Регистрация",
				signOut: "Выход",
				profile: "Профиль",
			},
		},
		views: {
			session: {
				new: {
					signIn: "Вход",
					submit: "Войти",
				},
			},
			users: {
				id: "ID",
				email: "Email",
				password: "Пароль",
				firstName: "Имя",
				lastName: "Фамилия",
				createdAt: "Дата создания",
				index: {
					title: "Пользователи",
					actions: "Действия",
					delete: "Удалить",
					empty: "Пользователей пока нет",
				},
				new: {
					submit: "Сохранить",
					signUp: "Регистрация",
				},
				edit: {
					title: "Редактирование профиля",
					submit: "Сохранить",
				},
				show: {
					title: "Профиль",
					edit: "Редактировать",
				},
			},
			statuses: {
				id: "ID",
				name: "Наименование",
				createdAt: "Дата создания",
				index: {
					title: "Статусы",
					actions: "Действия",
					create: "Создать статус",
					edit: "Изменить",
					delete: "Удалить",
					empty: "Статусов пока нет",
				},
				new: {
					title: "Создание статуса",
					submit: "Сохранить",
				},
				edit: {
					title: "Изменение статуса",
					submit: "Сохранить",
				},
			},
			labels: {
				id: "ID",
				name: "Наименование",
				createdAt: "Дата создания",
				index: {
					title: "Метки",
					actions: "Действия",
					create: "Создать метку",
					edit: "Изменить",
					delete: "Удалить",
					empty: "Меток пока нет",
				},
				new: {
					title: "Создание метки",
					submit: "Сохранить",
				},
				edit: {
					title: "Изменение метки",
					submit: "Сохранить",
				},
			},
			tasks: {
				id: "ID",
				name: "Название",
				description: "Описание",
				status: "Статус",
				labels: "Метки",
				labelsHint: "Нажимайте на метки, чтобы выбрать несколько",
				creator: "Создатель",
				executor: "Исполнитель",
				createdAt: "Дата создания",
				updatedAt: "Дата обновления",
				index: {
					title: "Задачи",
					actions: "Действия",
					edit: "Изменить",
					delete: "Удалить",
					newTask: "Новая задача",
					empty: "Задач пока нет",
					confirmDelete: "Вы уверены?",
					notOwner: "Только владелец может изменять/удалять",
					loginRequired: "Пожалуйста, войдите чтобы создать задачу",
				},
				new: {
					title: "Создание задачи",
					submit: "Сохранить",
				},
				edit: {
					title: "Изменение задачи",
					submit: "Сохранить",
				},
				show: {
					title: "Детали задачи",
					edit: "Изменить",
					delete: "Удалить",
				},
			},
			welcome: {
				index: {
					hello: "Привет от Хекслета!",
					description: "Практические курсы по программированию",
					more: "Узнать Больше",
				},
			},
		},
		validation: {
			emailTaken: "Этот email уже занят",
		},
	},
};
