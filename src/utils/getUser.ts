import * as fs from 'fs';
import { UserProfile } from 'src/type/interfaces/user.interface';

export async function getUserByUsername(username: string): Promise<UserProfile> {
    return new Promise((resolve, reject) => {
        fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            reject(new Error('Error reading users.json:', err));
        }
        const users = JSON.parse(data);
        const user = users.find((user: UserProfile) => user.username === username);
        resolve(user);
        });
    });
}


export async function getUsersByUserIds(userIds: string[]): Promise<UserProfile[]> {
    return new Promise((resolve, reject) => {
        fs.readFile('users.json', 'utf8', (err, data) => {
            if (err) {
                reject(new Error('Error reading users.json:', err));
            }
            const users = JSON.parse(data);
            const filtered = users
                .filter((user: UserProfile) => userIds.includes(user.id))
                .map((user: UserProfile) => {
                    const { password, username, ...rest } = user;
                    return rest;
                });
            resolve(filtered);
        });
    });
}