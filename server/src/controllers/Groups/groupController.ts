import { Request, Response } from "express";
import CreateGroupUseCase from "../../modules/Groups/application/GroupUseCases/createGroupUseCase";
import DeleteGroupUseCase from "../../modules/Groups/application/GroupUseCases/deleteGroupUseCase";
import GetGroupByIdUseCase from "../../modules/Groups/application/GroupUseCases/getGroupByIdUseCase";
import GetGroupsUseCase from "../../modules/Groups/application/GroupUseCases/getGroupsUseCase";
import UpdateGroupUseCase from "../../modules/Groups/application/GroupUseCases/updateGroupUseCase";
import { IGroupRepository } from "../../modules/Groups/domain/IGroupRepository";
import CheckGroupExistsUseCase from "../../modules/Groups/application/GroupUseCases/checkGroupUseCase";
import { ILogger } from "../../modules/Shared/Domain/Logging/ILogger";

class GroupsController {
  private readonly logger: ILogger;
  private readonly createGroupUseCase: CreateGroupUseCase;
  private readonly deleteGroupUseCase: DeleteGroupUseCase;
  private readonly getGroupByIdUseCase: GetGroupByIdUseCase;
  private readonly getGroupsUseCase: GetGroupsUseCase;
  private readonly updateGroupUseCase: UpdateGroupUseCase;
  private readonly checkGroupExistsUseCase: CheckGroupExistsUseCase;

  constructor(repository: IGroupRepository, logger: ILogger) {
    this.createGroupUseCase = new CreateGroupUseCase(repository);
    this.deleteGroupUseCase = new DeleteGroupUseCase(repository);
    this.getGroupByIdUseCase = new GetGroupByIdUseCase(repository);
    this.getGroupsUseCase = new GetGroupsUseCase(repository);
    this.updateGroupUseCase = new UpdateGroupUseCase(repository);
    this.checkGroupExistsUseCase = new CheckGroupExistsUseCase(repository);
    this.logger = logger.child("GroupsController");
  }

  async getGroups(_req: Request, res: Response): Promise<void> {
    try {
      const groups = await this.getGroupsUseCase.execute();
      res.status(200).json(groups);
    } catch (error) {
      this.logger.error("Error getting groups", {err: error});
      res.status(500).json({ error: "Server error" });
    }
  }

  async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const groupid = parseInt(req.params.id, 10);
      const group = await this.getGroupByIdUseCase.execute(groupid);
      if (group) {
        res.status(200).json(group);
      } else {
        res.status(404).json({ error: "Group not found" });
      }
    } catch (error) {
      this.logger.error("Error getting group by id", {err: error});
      res.status(500).json({ error: "Server error" });
    }
  }
  async checkGroupExists(req: Request, res: Response): Promise<void> {
    try {
      const groupid = parseInt(req.params.id, 10);
      const exists = await this.checkGroupExistsUseCase.execute(groupid);
      if (exists) {
        res.status(200).json(exists);
      } else {
        res
          .status(400)
          .json({ error: "Invalid groupid. Group does not exist." });
      }
    } catch (error) {
      this.logger.error("Error checking group exists", {err: error});
      res.status(500).json({ error: "Server error" });
    }
  }
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupName } = req.body;
      const { groupDetail } = req.body;
      const { creationDate } = req.body;
      const newGroup = await this.createGroupUseCase.execute({
        groupName,
        groupDetail,
        creationDate,
      });
      res.status(201).json(newGroup);
    } catch (error) {
      this.logger.error("Error creating group", {err: error});
      res.status(500).json({ error: "Server error" });
    }
  }

  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupid = parseInt(req.params.id, 10);
      await this.deleteGroupUseCase.execute(groupid);
      res.status(204).send();
    } catch (error) {
      this.logger.error("Error deleting group", {err: error});
      res.status(500).json({ error: "Server error" });
    }
  }

  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupid = parseInt(req.params.id, 10);
      const { groupDetail } = req.body;
      const { groupName } = req.body;
      const { creationDate } = req.body;

      const updatedGroup = await this.updateGroupUseCase.execute(groupid, {
        id: groupid,
        groupName,
        groupDetail,
        creationDate,
      });

      if (updatedGroup) {
        res.status(200).json(updatedGroup);
      } else {
        res.status(404).json({ error: "Group not found" });
      }
    } catch (error) {
      this.logger.error("Error updating group", {err: error});
      res.status(500).json({ error: "Server error" });
    }
  }
}

export default GroupsController;
