import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { IUser } from 'common/types/user.interface';
import { Skill } from './entities/skill.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import aqp from 'api-query-params';

@Injectable()
export class SkillsService {

  constructor(
    @InjectRepository(Skill) private skillsRepository: Repository<Skill>
  ) { }

  async create(createSkillDto: CreateSkillDto, user: IUser) {
    const isExist = await this.skillsRepository
      .createQueryBuilder('skills')
      .where('LOWER(skills.name) = LOWER(:name)', {
        name: createSkillDto.name.trim(),
      })
      .andWhere('skills.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (isExist) {
      throw new BadRequestException('Skill name already exists');
    }
    const skills = this.skillsRepository.create({
      ...createSkillDto,
      parentId: createSkillDto.parentId ?? null,
      createdBy: {
        id: user.id,
        email: user.email
      }
    });
    return this.skillsRepository.save(skills);
  }

  async findAll(currentPage: number, limit: number, qs: string, _user: IUser) {
    const { filter, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const normalizedPage = Number(currentPage) > 0 ? Number(currentPage) : 1;
    const requestedLimit = Number(limit);
    const withoutPagination = requestedLimit === 0;
    const pageSize = requestedLimit > 0 ? requestedLimit : 10;
    const offset = (normalizedPage - 1) * pageSize;

    const queryBuilder = this.skillsRepository
      .createQueryBuilder('skills')
      .where('skills.isDeleted = :isDeleted', { isDeleted: false });

    const likeFields = ['name', 'description'];
    Object.keys(filter).forEach((key) => {
      if (likeFields.includes(key)) {
        queryBuilder.andWhere(`skills.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
      } else {
        queryBuilder.andWhere(`skills.${key} = :${key}`, { [key]: filter[key] });
      }
    })

    if (sort && typeof sort === 'object') {
      Object.entries(sort).forEach(([key, value]) => {
        queryBuilder.addOrderBy(`skills.${key}`, value === -1 ? 'DESC' : 'ASC');
      });
    }
    if (!withoutPagination) {
      queryBuilder.skip(offset).take(pageSize);
    }

    const [result, totalItems] = await queryBuilder.getManyAndCount();

    return {
      meta: {
        currentPage: normalizedPage,
        pageSize: withoutPagination ? totalItems : pageSize,
        pages: withoutPagination ? (totalItems > 0 ? 1 : 0) : Math.ceil(totalItems / pageSize),
        total: totalItems,
      },
      result
    }
  }

  async findOne(id: string, user: IUser) {
    return "This action returns a #${id} skill";
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
