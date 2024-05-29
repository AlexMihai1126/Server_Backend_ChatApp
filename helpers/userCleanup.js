const Friend = require('../db_models/Friend');
const Media = require('../db_models/Media');
const Message = require('../db_models/Message');
const Conversation = require('../db_models/Conversation');
const path = require('path');
const fs = require('fs');
const User = require('../db_models/User');
const modulePrefix = "[UserDelete]";

async function removeUserFriendships(userId) {
    if (!userId) {
        throw new Error("Missing user ID");
    }
    try {
        await Friend.deleteMany({
            $or: [
                { person1: userId },
                { person2: userId }
            ]
        });
        console.log("User friendships removed successfully");
    } catch (error) {
        console.error("Error deleting friendships:", error);
    }
};

async function removeUserMedia(userId) {
    if (!userId) {
        throw new Error("Missing user ID");
    }

    try {
        const userMedia = await Media.find({ owner: userId });
        if(!userMedia){
            console.log("No user media.");
            return;
        }

        for (const mediaToDelete of userMedia) {
            try {
                const filePathInit = path.join(__dirname, '../uploads', mediaToDelete.uploadedFileName);
                const resizedFilePathInit = path.join(__dirname, '../uploads', 'rescaled', `rescaled_${mediaToDelete.uploadedFileName}`);
                const filePathMoved = path.join(__dirname, '../uploads', 'deleted', mediaToDelete.uploadedFileName);
                const resizedFilePathMoved = path.join(__dirname, '../uploads', 'deleted', `rescaled_${mediaToDelete.uploadedFileName}`);

                await fs.promises.rename(filePathInit, filePathMoved);
                await fs.promises.rename(resizedFilePathInit, resizedFilePathMoved);

                await mediaToDelete.deleteOne();

                console.log(`Media ${mediaToDelete.uploadedFileName} deleted successfully`);
            } catch (fileError) {
                console.error('Error deleting files:', fileError);
            }
        }

        console.log("All user media removed successfully");
    } catch (error) {
        console.error("Error deleting media:", error);
    }
}


async function removeUserMessages(userId) {
    try {
        await Message.deleteMany({ sender: userId });
        console.log("User messages removed successfully");
    } catch (error) {
        console.error("Error deleting messages:", error);
    }
}

async function removeUserFromConversations(userId) {
    try {
        const conversations = await Conversation.find({ members: userId });

        for (const conversation of conversations) {
            conversation.members = conversation.members.filter(member => !member.equals(userId));

            if (conversation.creator.equals(userId)) {
                if (conversation.members.length > 0) {
                    const newCreatorIndex = Math.floor(Math.random() * conversation.members.length);
                    conversation.creator = conversation.members[newCreatorIndex];
                } else {
                    await conversation.remove();
                    continue;
                }
            }
            await conversation.save();
        }

        console.log("User removed from conversations successfully");
    } catch (error) {
        console.error("Error removing user from conversations:", error);
    }
};

async function removeUserProfilePicture(pfpId) {
    try {
        const mediaToDelete = await Media.findById(pfpId);
        const pfpInit = path.join(__dirname, '../uploads', 'profilepics', mediaToDelete.uploadedFileName);
        const pfpMoved = path.join(__dirname, '../uploads', 'deleted', mediaToDelete.uploadedFileName);

        await fs.promises.rename(pfpInit, pfpMoved);
        await mediaToDelete.deleteOne();

        console.log('User profile picture deleted successfully');
    } catch (error) {
        console.error('Error deleting user profile picture:', error);
    }
};

async function cleanupUser(userId) {
    if (!userId) {
        throw new Error("Missing user ID");
    }

    try {
        const userToDelete = await User.findById(userId);

        const cleanupTasks = [
            removeUserFriendships(userToDelete._id),
            removeUserMedia(userToDelete._id),
            removeUserMessages(userToDelete._id),
            removeUserFromConversations(userToDelete._id)
        ];

        if (userToDelete.picture != null) {
            cleanupTasks.push(removeUserProfilePicture(userToDelete._id));
        }

        await Promise.all(cleanupTasks);

        console.log("User cleanup completed successfully");
    } catch (error) {
        console.error("Error during user cleanup:", error);
    }
}

module.exports = { cleanupUser };