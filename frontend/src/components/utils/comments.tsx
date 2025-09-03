import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useUser } from '../contexts/usercontext';
import { getS3ImageUrl } from "../utils/s3helper"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"



interface Comment {
  commentID: string;
  userEmail: string;
  userName: string;
  profilePhotoKey?: string;
  commentText: string;
  createdAt: string;
  likes: number;
  hasLiked: boolean;
  replies?: Comment[];
  hasMoreReplies?: boolean;
}

interface CommentsProps {
  entryID: string;
  className?: string;
}

const Comments: React.FC<CommentsProps> = ({ entryID, className = "" }) => {
  const { user, isAuthenticated } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Fetch comments
  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`https://api.benchracershq.com/api/explore/getcomments/${entryID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setComments(data.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [entryID]);

  // Handle adding a comment
  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch('https://api.benchracershq.com/api/explore/addcomments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          entryID,
          commentText: commentText.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setComments(prev => [data.data, ...prev]);
        setCommentText("");
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle liking a comment
  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/auth';
      return;
    }

    try {
      const response = await fetch(`https://api.benchracershq.com/api/explore/likecomment/${commentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setComments(prev => prev.map(comment => {
          if (comment.commentID === commentId) {
            return {
              ...comment,
              likes: data.data.likes,
              hasLiked: data.data.hasLiked
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.commentID === commentId 
                  ? { ...reply, likes: data.data.likes, hasLiked: data.data.hasLiked }
                  : reply
              )
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`https://api.benchracershq.com/api/explore/delcomments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setComments(prev => prev.filter(comment => comment.commentID !== commentId)
          .map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.commentID !== commentId) || []
          }))
        );
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Handle replying to a comment
  const handleReplySubmit = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    try {
      const response = await fetch('https://api.benchracershq.com/api/explore/addcomments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          entryID,
          commentText: replyText.trim(),
          parentCommentID: parentCommentId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setComments(prev => prev.map(comment => {
          if (comment.commentID === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.data]
            };
          }
          return comment;
        }));
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Format time ago
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Single comment component
  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-6' : ''}`}>
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        <Avatar className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'}`} >
            <AvatarImage className="w-full h-full object-cover object-center" src={comment?.profilePhotoKey
                ? getS3ImageUrl(comment?.profilePhotoKey)
                : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(comment?.userName || "User")}`
                } alt="User" />
            <AvatarFallback>{comment?.userName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
       
      </div>
      
      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className={`bg-gray-700/50 rounded-2xl px-4 py-3 ${isReply ? 'bg-gray-600/50' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-white ${isReply ? 'text-xs' : 'text-sm'}`}>
                {comment.userName}
              </span>
              <span className="text-gray-400 text-xs">
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            
            {/* Delete button for own comments */}
            {isAuthenticated && user?.userEmail === comment.userEmail && (
              <button
                onClick={() => handleDeleteComment(comment.commentID)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className={`text-gray-200 ${isReply ? 'text-xs' : 'text-sm'} leading-relaxed break-words`}>
            {comment.commentText}
          </p>
        </div>
        
        {/* Comment Actions */}
        <div className="flex items-center gap-4 mt-2 ml-4">
          <button 
            onClick={() => handleLikeComment(comment.commentID)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              comment.hasLiked ? 'text-red-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className={`w-3 h-3 ${comment.hasLiked ? 'fill-current' : ''}`} />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>
          
          {!isReply && (
            <button 
              onClick={() => setReplyingTo(replyingTo === comment.commentID ? null : comment.commentID)}
              className="text-gray-400 hover:text-white text-xs font-medium transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Reply Input */}
        {replyingTo === comment.commentID && (
          <div className="mt-3 ml-4 flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-400 rounded-xl resize-none min-h-[35px] text-sm"
                rows={1}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleReplySubmit(comment.commentID)}
                  disabled={!replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Replies Button */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <button
            onClick={() => toggleReplies(comment.commentID)}
            className="text-gray-400 hover:text-white text-xs mt-2 ml-4 flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            {expandedReplies.has(comment.commentID) ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Replies */}
        {!isReply && expandedReplies.has(comment.commentID) && comment.replies && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.commentID} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
  <div className={`h-full flex flex-col gap-4 mx-auto ${className}`}>
    
    {/* Header - Fixed size */}
    <div className="flex justify-between items-center flex-shrink-0">
      <h3 className="text-3xl mb-5 font-bold text-white">
        Comments
      </h3>
      <span className="text-gray-400 text-lg">
        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </span>
    </div>

    {/* Comments List - Scrollable, takes remaining space */}
    <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-2xl p-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 min-h-0">
      {isLoadingComments ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <CommentItem key={comment.commentID} comment={comment} />
        ))
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 mb-2">No comments yet</p>
            <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
          </div>
        </div>
      )}
    </div>

    {/* Comment Input - Fixed at bottom */}
    <div className="flex-shrink-0">
      {isAuthenticated ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            
            <Avatar className="w-8 h-8 ">
                <AvatarImage className="w-full h-full object-cover object-center" src={user?.profilephotokey 
                        ? getS3ImageUrl(user?.profilephotokey)
                        : `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(user?.name || "User")}`
                    } alt="User" />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            
            {/* Input Field */}
            <div className="flex-1 relative">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 rounded-2xl resize-none min-h-[40px] max-h-[80px] pr-12"
                rows={1}
              />
              {/* Send Button */}
              <button 
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment || commentText.length > 1000}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingComment ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Character count */}
          <div className="text-right">
            <span className={`text-xs ${commentText.length > 900 ? 'text-red-400' : 'text-gray-400'}`}>
              {commentText.length}/1000
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Button
            onClick={() => window.location.href = '/auth'}
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
          >
            Login to Comment
          </Button>
        </div>
      )}
    </div>
  </div>
);
}

export default Comments;