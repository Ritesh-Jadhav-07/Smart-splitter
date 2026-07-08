import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/api-response.js";

import groupService from "../services/group.service.js";

class GroupController {
  /**
   * Create Group
   */
  createGroup = asyncHandler(async (req, res) => {
    const group = await groupService.createGroup({
      ...req.body,

      createdBy: req.user._id,
    });

    return res.status(201).json(
      new ApiResponse(
        201,

        group,

        "Group created successfully.",
      ),
    );
  });

  /**
   * Get My Groups
   */
  getMyGroups = asyncHandler(async (req, res) => {
    const groups = await groupService.getMyGroups(req.user._id);

    return res.status(200).json(
      new ApiResponse(
        200,

        groups,

        "Groups fetched successfully.",
      ),
    );
  });

  /**
   * Get Group By Id
   */
  getGroupById = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await groupService.getGroupById(
      groupId,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        group,

        "Group fetched successfully.",
      ),
    );
  });

  /**
   * Update Group
   */
  updateGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await groupService.updateGroup(
      groupId,

      req.body,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        group,

        "Group updated successfully.",
      ),
    );
  });
  /**
   * Add Members
   */
  addMembers = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const { members } = req.body;

    const group = await groupService.addMembers(
      groupId,

      members,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        group,

        "Members added successfully.",
      ),
    );
  });

  /**
   * Remove Member
   */
  removeMember = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;

    const group = await groupService.removeMember(
      groupId,

      userId,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        group,

        "Member removed successfully.",
      ),
    );
  });

  /**
   * Leave Group
   */
  leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const result = await groupService.leaveGroup(
      groupId,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        result,

        "Left group successfully.",
      ),
    );
  });

  /**
   * Make Admin
   */
  makeAdmin = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;

    const group = await groupService.makeAdmin(
      groupId,

      userId,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        group,

        "Member promoted to admin successfully.",
      ),
    );
  });

  /**
   * Delete Group
   */
  deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const result = await groupService.deleteGroup(
      groupId,

      req.user._id,
    );

    return res.status(200).json(
      new ApiResponse(
        200,

        result,

        "Group deleted successfully.",
      ),
    );
  });
}

export default new GroupController();
