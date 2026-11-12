// @ts-check

import labels from "./labels.js";
import session from "./session.js";
import statuses from "./statuses.js";
import tasks from "./tasks.js";
import users from "./users.js";
import welcome from "./welcome.js";

const controllers = [welcome, users, session, statuses, labels, tasks];

export default (app) => {
	controllers.forEach((f) => {
		f(app);
	});
};
