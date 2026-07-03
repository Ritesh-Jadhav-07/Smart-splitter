import { User } from "../models/user.js";
import { FriendRequest } from "../models/friendRequest.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const searchUser = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email }).select(
    "_id name email profilePhoto",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot search yourself");
  }

  return res.status(200).json(new ApiResponse(200, user, "User found"));
});

const sendFriendRequest = asyncHandler(async (req, res) => {
  const sender = await User.findById(req.user._id);

  const { receiverId } = req.params;

  if (!receiverId) {
    throw new ApiError(400, "Receiver ID is required");
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    throw new ApiError(404, "Receiver not found");
  }

  if (receiver._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot send a friend request to yourself");
  }

  if (sender.friends.includes(receiver._id)) {
    throw new ApiError(400, "You are already friends with this user");
  }

  const existingRequest = await FriendRequest.findOne({
    sender: req.user._id,
    receiver: receiverId,
    status: "pending",
  });

  if (existingRequest) {
    throw new ApiError(400, "Friend request already sent");
  }

  const reverseRequest = await FriendRequest.findOne({
    sender: receiverId,
    receiver: sender._id,
    status: "pending",
  });

  if (reverseRequest) {
    reverseRequest.status = "accepted";
    await reverseRequest.save();

    sender.friends.push(receiver._id);
    receiver.friends.push(sender._id);

    await sender.save();

    await receiver.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          reverseRequest,
          "Friend request accepted automatically",
        ),
      );
  }

  const friendRequest = await FriendRequest.create({
    sender: req.user._id,
    receiver: receiverId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, friendRequest, "Friend request sent"));
});

const getPendingRequests = asyncHandler(async (req, res) => {

  const user = req.user._id;

  const pendingRequests = await FriendRequest.find({
    receiver: user,
    status: "pending",

  }).populate("sender", "_id name email profilePhoto");

  return res.status(200).json(
    new ApiResponse(200, pendingRequests, "Pending friend requests"),
  )

});

const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    throw new ApiError(400, "Request ID is required");
  }

  // Find the friend request
  const friendRequest = await FriendRequest.findById(requestId);

  if (!friendRequest) {
    throw new ApiError(404, "Friend request not found");
  }

  // Only the receiver can accept the request
  if (friendRequest.receiver.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to accept this friend request"
    );
  }

  // Request should still be pending
  if (friendRequest.status !== "pending") {
    throw new ApiError(400, "Friend request has already been processed");
  }

  // Fetch both users
  const [sender, receiver] = await Promise.all([
    User.findById(friendRequest.sender),
    User.findById(friendRequest.receiver),
  ]);

  if (!sender || !receiver) {
    throw new ApiError(404, "User not found");
  }

  // Update request status
  friendRequest.status = "accepted";

  // Add friends (avoid duplicates)
  if (!sender.friends.includes(receiver._id)) {
    sender.friends.push(receiver._id);
  }

  if (!receiver.friends.includes(sender._id)) {
    receiver.friends.push(sender._id);
  }

  // Save all changes together
  await Promise.all([
    sender.save(),
    receiver.save(),
    friendRequest.save(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      friendRequest,
      "Friend request accepted successfully"
    )
  );
});

const rejectFriendRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;

    if (!requestId) {
        throw new ApiError(400, "Request ID is required");
    }

    // Find the friend request
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
        throw new ApiError(404, "Friend request not found");
    }   

    // Only the receiver can reject the request
    if (friendRequest.receiver.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to reject this friend request"
        );
    }

    // Request should still be pending
    if (friendRequest.status !== "pending") {
        throw new ApiError(400, "Friend request has already been processed");
    }

    // Update request status
    friendRequest.status = "rejected";
    await friendRequest.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            friendRequest,
            "Friend request rejected successfully"
        )
    );
});

const getFriends = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("friends", "_id name email profilePhoto");

    if (!user) {
        throw new ApiError(404, "User not found");
    }   

    return res.status(200).json(
        new ApiResponse(
            200,        
            user.friends,
            "Friends list retrieved successfully"
        )
    );

});

export {
  searchUser,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
};
