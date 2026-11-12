// @ts-check

export default {
	translation: {
		appName: "Fastify Boilerplate",
		flash: {
			session: {
				create: {
					success: "You are logged in",
					error: "Wrong email or password",
				},
				delete: {
					success: "You are logged out",
				},
			},
			users: {
				create: {
					error: "Failed to register",
					success: "User registered successfully",
				},
				update: {
					success: "User updated successfully",
				},
				delete: {
					success: "User deleted successfully",
				},
			},
			statuses: {
				create: {
					success: "Status created successfully",
					error: "Failed to create a status",
				},
				update: {
					success: "Status edited successfully",
					error: "Failed to edit a status",
				},
				delete: {
					success: "Status deleted",
				},
			},
			labels: {
				create: {
					success: "Label created successfully",
					error: "Failed to create a label",
				},
				update: {
					success: "Label edited successfully",
					error: "Failed to edit a label",
				},
				delete: {
					success: "Label deleted",
				},
			},
			tasks: {
				create: {
					success: "Task created successfully",
					error: "Failed to create a task",
				},
				update: {
					success: "Task updated successfully",
					error: "Failed to update a task",
				},
				delete: {
					success: "Task deleted successfully",
				},
			},
			authError: "Access denied! Please login",
		},
		layouts: {
			application: {
				users: "Users",
				statuses: "Statuses",
				labels: "Labels",
				tasks: "Tasks",
				signIn: "Login",
				signUp: "Register",
				signOut: "Logout",
				profile: "Profile",
			},
		},
		views: {
			session: {
				new: {
					signIn: "Login",
					submit: "Login",
				},
			},
			users: {
				id: "ID",
				email: "Email",
				password: "Password",
				firstName: "First name",
				lastName: "Last name",
				createdAt: "Created at",
				index: {
					title: "Users",
					actions: "Actions",
					delete: "Delete",
					empty: "No users yet",
				},
				new: {
					submit: "Register",
					signUp: "Register",
				},
				edit: {
					title: "Edit profile",
					submit: "Save",
				},
				show: {
					title: "Profile",
					edit: "Edit",
				},
			},
			statuses: {
				id: "ID",
				name: "Name",
				createdAt: "Created at",
				index: {
					title: "Statuses",
					actions: "Actions",
					create: "Create status",
					edit: "Edit",
					delete: "Delete",
					empty: "No statuses yet",
				},
				new: {
					title: "Create status",
					submit: "Save",
				},
				edit: {
					title: "Edit status",
					submit: "Save",
				},
			},
			labels: {
				id: "ID",
				name: "Name",
				createdAt: "Created at",
				index: {
					title: "Labels",
					actions: "Actions",
					create: "Create label",
					edit: "Edit",
					delete: "Delete",
					empty: "No labels yet",
				},
				new: {
					title: "Create label",
					submit: "Save",
				},
				edit: {
					title: "Edit label",
					submit: "Save",
				},
			},
			tasks: {
				id: "ID",
				name: "Name",
				description: "Description",
				status: "Status",
				labels: "Labels",
				labelsHint: "Click labels to select several",
				creator: "Creator",
				executor: "Executor",
				createdAt: "Created at",
				updatedAt: "Updated at",
				index: {
					title: "Tasks",
					actions: "Actions",
					edit: "Edit",
					delete: "Delete",
					newTask: "New task",
					empty: "No tasks yet",
					confirmDelete: "Are you sure?",
					notOwner: "Only owner can edit/delete",
					loginRequired: "Please log in to create a task",
				},
				new: {
					title: "Create task",
					submit: "Save",
				},
				edit: {
					title: "Edit task",
					submit: "Save",
				},
				show: {
					title: "Task details",
					edit: "Edit",
					delete: "Delete",
				},
			},
			welcome: {
				index: {
					hello: "Hello from Hexlet!",
					description: "Online programming school",
					more: "Learn more",
				},
			},
		},
		validation: {
			emailTaken: "This email is already taken",
		},
	},
};
