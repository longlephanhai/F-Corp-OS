import { IS_PUBLIC_PERMISSION } from 'decorator/customize';

jest.mock('./users.service', () => ({
  UsersService: class UsersService {},
}));

import { UsersController } from './users.controller';

describe('UsersController', () => {
  const usersService = {
    create: jest.fn(),
    getMyTeam: jest.fn(),
  };
  const controller = new UsersController(usersService as any);

  beforeEach(() => jest.clearAllMocks());

  it('does not bypass the permission guard at controller or list route level', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_PERMISSION, UsersController)).toBeUndefined();
    expect(
      Reflect.getMetadata(IS_PUBLIC_PERMISSION, UsersController.prototype.findAll),
    ).toBeUndefined();
  });

  it('scopes the PM team route to the authenticated manager', async () => {
    usersService.getMyTeam.mockResolvedValue([]);

    await controller.getMyTeam({ id: 'pm-1' } as any);

    expect(usersService.getMyTeam).toHaveBeenCalledWith('pm-1');
  });
});
