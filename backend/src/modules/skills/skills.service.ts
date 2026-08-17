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
    const isExist = await this.skillsRepository.findOne({
      where: { name: createSkillDto.name }
    });

    if (isExist) {
      throw new BadRequestException('Skill name already exists');
    }
    const skills = this.skillsRepository.create({
      ...createSkillDto,
      createdBy: {
        id: user.id,
        email: user.email
      }
    });
    return this.skillsRepository.save(skills);
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const queryBuilder = this.skillsRepository
      .createQueryBuilder('skills')

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
    const [result, totalItems] = await queryBuilder
      .skip(offset)
      .take(defaultLimit)
      .getManyAndCount()
      
    return {
      meta: {
        currentPage: +currentPage,
        pageSize: +limit,
        pages: Math.ceil(totalItems / defaultLimit),
        total: totalItems,
      },
      result
    }

  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
