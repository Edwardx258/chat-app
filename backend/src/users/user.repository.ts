import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    // 创建新用户：自动对密码加盐
    async createUser(username: string, plainPassword: string): Promise<User> {
        const user = new User();
        user.username = username;
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(plainPassword, salt);
        return this.save(user);
    }

    // 验证密码
    async validatePassword(user: User, plainPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, user.password);
    }

    // 查找用户
    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({ where: { username } });
    }
}
