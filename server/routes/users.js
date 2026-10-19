// @ts-check

import _ from 'lodash';
import i18next from 'i18next';
import { createUser, findUserByEmail } from '../lib/users.js';
import { registrationSchema, validate } from '../lib/validation.js';

const pickUserData = (body) => ({
    email: _.get(body, 'data.email', ''),
    password: _.get(body, 'data.password', ''),
    firstName: _.get(body, 'data.firstName', null),
    lastName: _.get(body, 'data.lastName', null),
});

export default (app) => {
    app
        .get('/users/new', { name: 'newUser' }, (_req, reply) => {
            reply.render('users/new', { entity: {}, errors: {} });
        })
        .post('/users', { name: 'createUser' }, async (req, reply) => {
            const entity = pickUserData(req.body);
            const { value, errors } = await validate(registrationSchema, entity);

            let formErrors = errors;
            if (!formErrors && value) {
                const existingUser = await findUserByEmail(value.email);
                if (existingUser) {
                    formErrors = { email: [{ message: i18next.t('validation.emailTaken') }] };
                }
            }

            if (formErrors || !value) {
                reply.code(422);
                await reply.render('users/new', { entity, errors: formErrors ?? {} });
                return;
            }

            try {
                await createUser(value);
            } catch (err) {
                if (err?.code === '23505') {
                    reply.code(422);
                    await reply.render('users/new', {
                        entity,
                        errors: { email: [{ message: i18next.t('validation.emailTaken') }] },
                    });
                    return;
                }
                throw err;
            }

            req.flash('success', i18next.t('flash.users.create.success'));
            reply.redirect(app.reverse('newSession'));
        });
};
