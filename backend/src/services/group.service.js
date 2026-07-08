import mongoose from "mongoose";

import { Group } from "../models/group.model.js";
import { User } from "../models/user.js";

import { GROUP_ROLES } from "../constants/expense.constants.js";

import { ApiError } from "../utils/api-error.js";
import { Expense } from "../models/expense.model.js";

class GroupService {
  /**
   * Create Group
   */
  async createGroup(groupData) {
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
      const {
        name,
        description,
        members = [],
        groupPhoto,
        createdBy,
      } = groupData;

      //--------------------------------------------------
      // Validation
      //--------------------------------------------------

      if (!name?.trim()) {
        throw new ApiError(400, "Group name is required.");
      }

      //--------------------------------------------------
      // Creator Exists
      //--------------------------------------------------

      const creator = await User.findById(createdBy);

      if (!creator) {
        throw new ApiError(404, "Creator not found.");
      }

      //--------------------------------------------------
      // Remove Duplicate Members
      //--------------------------------------------------

      const uniqueMembers = [
        ...new Set(members.map((member) => member.toString())),
      ];

      //--------------------------------------------------
      // Creator Must Be Included
      //--------------------------------------------------

      if (!uniqueMembers.includes(createdBy.toString())) {
        uniqueMembers.push(createdBy.toString());
      }

      //--------------------------------------------------
      // Minimum Members
      //--------------------------------------------------

      if (uniqueMembers.length < 2) {
        throw new ApiError(400, "A group must contain at least two members.");
      }

      //--------------------------------------------------
      // Validate Users
      //--------------------------------------------------

      const users = await User.find({
        _id: {
          $in: uniqueMembers,
        },
      });

      if (users.length !== uniqueMembers.length) {
        throw new ApiError(400, "One or more members do not exist.");
      }

      //--------------------------------------------------
      // Validate Friend Relation
      //--------------------------------------------------

      const creatorFriends = creator.friends.map((friend) => friend.toString());

      for (const memberId of uniqueMembers) {
        if (
          memberId !== createdBy.toString() &&
          !creatorFriends.includes(memberId)
        ) {
          throw new ApiError(
            400,
            "You can only create groups with your friends.",
          );
        }
      }

      //--------------------------------------------------
      // Build Members Array
      //--------------------------------------------------

      const groupMembers = uniqueMembers.map((memberId) => ({
        user: memberId,

        role:
          memberId === createdBy.toString()
            ? GROUP_ROLES.ADMIN
            : GROUP_ROLES.MEMBER,
      }));
      //--------------------------------------------------
      // Create Group
      //--------------------------------------------------

      const [group] = await Group.create(
        [
          {
            name: name.trim(),
            description: description?.trim() || "",
            members: groupMembers,
            createdBy,
            groupPhoto: groupPhoto || "",
          },
        ],
        { session },
      );

      //--------------------------------------------------
      // Commit
      //--------------------------------------------------

      await session.commitTransaction();

      return await Group.findById(group._id)
        .populate("createdBy", "name email profilePhoto")
        .populate("members.user", "name email profilePhoto");
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get All Groups Of Logged In User
   */
  async getMyGroups(userId) {
    return await Group.find({
      "members.user": userId,

      isActive: true,
    })
      .populate("createdBy", "name email profilePhoto")
      .populate("members.user", "name email profilePhoto")
      .sort({
        updatedAt: -1,
      });
  }

  /**
   * Get Group Details
   */
  async getGroupById(groupId, userId) {
    const group = await Group.findById(groupId)
      .populate("createdBy", "name email profilePhoto")
      .populate("members.user", "name email profilePhoto");

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Check Membership
    //--------------------------------------------------

    const isMember = group.members.some(
      (member) => member.user._id.toString() === userId.toString(),
    );

    if (!isMember) {
      throw new ApiError(
        403,

        "You are not a member of this group.",
      );
    }

    return group;
  }

  /**
   * Update Group
   */
  async updateGroup(groupId, data, userId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Only Admin
    //--------------------------------------------------

    const admin = group.members.find(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!admin || admin.role !== GROUP_ROLES.ADMIN) {
      throw new ApiError(
        403,

        "Only admins can update the group.",
      );
    }

    if (data.name) {
      group.name = data.name.trim();
    }

    if (data.description !== undefined) {
      group.description = data.description.trim();
    }

    if (data.groupPhoto !== undefined) {
      group.groupPhoto = data.groupPhoto;
    }

    await group.save();

    return await Group.findById(group._id)
      .populate("createdBy", "name email profilePhoto")
      .populate("members.user", "name email profilePhoto");
  }
  /**
   * Add Members
   */
  async addMembers(groupId, memberIds, userId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Only Admin
    //--------------------------------------------------

    const admin = group.members.find(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!admin || admin.role !== GROUP_ROLES.ADMIN) {
      throw new ApiError(403, "Only admins can add members.");
    }

    //--------------------------------------------------
    // Validate Users
    //--------------------------------------------------

    const users = await User.find({
      _id: {
        $in: memberIds,
      },
    });

    if (users.length !== memberIds.length) {
      throw new ApiError(400, "One or more users do not exist.");
    }

    //--------------------------------------------------
    // Remove Existing Members
    //--------------------------------------------------

    const existingMembers = group.members.map((member) =>
      member.user.toString(),
    );

    const newMembers = memberIds.filter(
      (id) => !existingMembers.includes(id.toString()),
    );

    if (!newMembers.length) {
      throw new ApiError(400, "All users are already members.");
    }

    //--------------------------------------------------
    // Add Members
    //--------------------------------------------------

    for (const memberId of newMembers) {
      group.members.push({
        user: memberId,

        role: GROUP_ROLES.MEMBER,
      });
    }

    await group.save();

    return await Group.findById(group._id)
      .populate("createdBy", "name email profilePhoto")
      .populate("members.user", "name email profilePhoto");
  }

  /**
   * Remove Member
   */
  async removeMember(groupId, memberId, userId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Only Admin
    //--------------------------------------------------

    const admin = group.members.find(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!admin || admin.role !== GROUP_ROLES.ADMIN) {
      throw new ApiError(403, "Only admins can remove members.");
    }

    //--------------------------------------------------
    // Cannot Remove Creator
    //--------------------------------------------------

    if (group.createdBy.toString() === memberId.toString()) {
      throw new ApiError(400, "Group creator cannot be removed.");
    }

    //--------------------------------------------------
    // Member Exists
    //--------------------------------------------------

    const member = group.members.find(
      (member) => member.user.toString() === memberId.toString(),
    );

    if (!member) {
      throw new ApiError(404, "Member not found.");
    }

    //--------------------------------------------------
    // Last Admin Check
    //--------------------------------------------------

    if (member.role === GROUP_ROLES.ADMIN) {
      const adminCount = group.members.filter(
        (member) => member.role === GROUP_ROLES.ADMIN,
      ).length;

      if (adminCount === 1) {
        throw new ApiError(400, "Cannot remove the last admin.");
      }
    }

    //--------------------------------------------------
    // Minimum Members
    //--------------------------------------------------

    if (group.members.length <= 2) {
      throw new ApiError(400, "A group must contain at least two members.");
    }

    //--------------------------------------------------
    // Remove Member
    //--------------------------------------------------

    group.members = group.members.filter(
      (member) => member.user.toString() !== memberId.toString(),
    );

    await group.save();

    return await Group.findById(group._id)
      .populate("createdBy", "name email profilePhoto")
      .populate("members.user", "name email profilePhoto");
  }

  /**
   * Leave Group
   */
  async leaveGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Creator Cannot Leave
    //--------------------------------------------------

    if (group.createdBy.toString() === userId.toString()) {
      throw new ApiError(400, "Group creator cannot leave the group.");
    }

    //--------------------------------------------------
    // Member Exists
    //--------------------------------------------------

    const member = group.members.find(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!member) {
      throw new ApiError(404, "You are not a member of this group.");
    }

    //--------------------------------------------------
    // Last Admin Check
    //--------------------------------------------------

    if (member.role === GROUP_ROLES.ADMIN) {
      const adminCount = group.members.filter(
        (member) => member.role === GROUP_ROLES.ADMIN,
      ).length;

      if (adminCount === 1) {
        throw new ApiError(
          400,
          "Transfer admin role before leaving the group.",
        );
      }
    }

    //--------------------------------------------------
    // Minimum Members
    //--------------------------------------------------

    if (group.members.length <= 2) {
      throw new ApiError(400, "A group must contain at least two members.");
    }

    //--------------------------------------------------
    // Remove User
    //--------------------------------------------------

    group.members = group.members.filter(
      (member) => member.user.toString() !== userId.toString(),
    );

    await group.save();

    return {
      message: "You left the group successfully.",
    };
  }

  /**
   * Make Admin
   */
  async makeAdmin(groupId, targetUserId, userId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Requester Must Be Admin
    //--------------------------------------------------

    const requester = group.members.find(
      (member) => member.user.toString() === userId.toString(),
    );

    if (!requester || requester.role !== GROUP_ROLES.ADMIN) {
      throw new ApiError(403, "Only admins can promote members.");
    }

    //--------------------------------------------------
    // Target Member
    //--------------------------------------------------

    const target = group.members.find(
      (member) => member.user.toString() === targetUserId.toString(),
    );

    if (!target) {
      throw new ApiError(404, "Member not found.");
    }

    if (target.role === GROUP_ROLES.ADMIN) {
      throw new ApiError(400, "User is already an admin.");
    }

    target.role = GROUP_ROLES.ADMIN;

    await group.save();

    return await Group.findById(group._id)
      .populate("createdBy", "name email profilePhoto")
      .populate("members.user", "name email profilePhoto");
  }

  /**
   * Delete Group (Soft Delete)
   */
  async deleteGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      throw new ApiError(404, "Group not found.");
    }

    //--------------------------------------------------
    // Only Creator Can Delete
    //--------------------------------------------------

    if (group.createdBy.toString() !== userId.toString()) {
      throw new ApiError(403, "Only the group creator can delete the group.");
    }

    //--------------------------------------------------
    // Check Active Expenses
    //--------------------------------------------------

    const activeExpenses = await Expense.countDocuments({
      group: groupId,

      isDeleted: false,
    });

    if (activeExpenses > 0) {
      throw new ApiError(
        400,

        "Cannot delete a group that contains expenses.",
      );
    }

    //--------------------------------------------------
    // Soft Delete
    //--------------------------------------------------

    group.isActive = false;

    await group.save();

    return {
      message: "Group deleted successfully.",
    };
  }
}

export default new GroupService();
