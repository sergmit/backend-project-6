// @ts-check

import session from './session.js';
import users from './users.js';
import welcome from './welcome.js';

const controllers = [welcome, users, session];

export default (app) => {
    controllers.forEach((f) => {
        f(app);
    });
};