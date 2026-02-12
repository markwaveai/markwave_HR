import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, PlusCircle, Calendar, Zap, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { feedApi } from '../../services/api';
import ConfirmDialog from '../Common/ConfirmDialog';
import LoadingSpinner from '../Common/LoadingSpinner';

const FeedSection = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [postType, setPostType] = useState('Activity'); // Activity or Event
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [commentingOn, setCommentingOn] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, postId: null, commentId: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef(null);

    const isAdmin = ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations'].includes(user?.role) || (user?.first_name === 'Rajesh' || user?.first_name === 'Satyanarayana');

    const fetchPosts = async () => {
        try {
            const data = await feedApi.getPosts();
            setPosts(data);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newImages = [...selectedImages, ...files];
            setSelectedImages(newImages);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index) => {
        const newImages = [...selectedImages];
        newImages.splice(index, 1);
        setSelectedImages(newImages);

        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        if (!newPostContent.trim() && imagePreviews.length === 0) return;

        setIsPosting(true);
        try {
            await feedApi.createPost({
                author_id: user.employee_id,
                content: newPostContent,
                images: imagePreviews, // Sending array of base64
                type: postType
            });
            setNewPostContent('');
            setImagePreviews([]);
            setSelectedImages([]);
            fetchPosts();
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Failed to create post.";
            alert(errorMsg);
        } finally {
            setIsPosting(false);
        }
    };

    const handleToggleLike = async (postId) => {
        if (!user?.employee_id) return;

        // Optimistic UI update
        const previousPosts = [...posts];
        setPosts(currentPosts => currentPosts.map(post => {
            if (post.id === postId) {
                const isLiked = post.likes.includes(user.employee_id);
                return {
                    ...post,
                    likes: isLiked
                        ? post.likes.filter(id => id !== user.employee_id)
                        : [...post.likes, user.employee_id],
                    likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
                };
            }
            return post;
        }));

        try {
            await feedApi.toggleLike(postId, user.employee_id);
            // No need to fetchPosts() immediately as state is already updated
        } catch (error) {
            console.error("Like failed:", error);
            setPosts(previousPosts); // Revert on failure
        }
    };

    const handleAddComment = async (postId) => {
        if (!newComment.trim() || !user?.employee_id) return;
        try {
            await feedApi.addComment(postId, user.employee_id, newComment);
            setNewComment('');
            setCommentingOn(null);
            fetchPosts();
        } catch (error) {
            console.error("Comment failed:", error);
        }
    };

    const handleDeletePost = (postId) => {
        setDeleteConfig({
            isOpen: true,
            postId: postId,
            commentId: null
        });
    };

    const handleDeleteComment = (postId, commentId) => {
        setDeleteConfig({
            isOpen: true,
            postId: postId,
            commentId: commentId
        });
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        const { postId, commentId } = deleteConfig;

        try {
            if (commentId) {
                await feedApi.deleteComment(postId, commentId, user.employee_id);
            } else {
                await feedApi.deletePost(postId);
            }
            await fetchPosts();
            setDeleteConfig({ isOpen: false, postId: null, commentId: null });
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete item.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-[#2d3436] flex items-center gap-2">
                <Zap size={20} className="text-[#6366f1]" />
                Community Wall
            </h2>

            {user && isAdmin && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                    {/* ... textarea section ... */}
                    <div className="flex gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] font-bold shrink-0">
                            {user?.first_name?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share an office activity or event..."
                                className="w-full resize-none border-none focus:ring-0 focus:outline-none text-sm py-2"
                                rows="2"
                            />

                            {imagePreviews.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {imagePreviews.map((preview, idx) => (
                                        <div key={idx} className="relative inline-block w-24 h-24">
                                            <img
                                                src={preview}
                                                alt={`Preview ${idx}`}
                                                className="w-full h-full object-cover rounded-lg border border-[#f1f5f9]"
                                            />
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md border border-[#f1f5f9] text-[#64748b] hover:text-[#ef4444]"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f1f5f9]">
                        <div className="flex items-center gap-3 mm:gap-4">
                            {/* ... type buttons ... */}
                            <div className="flex gap-1.5 mm:gap-2">
                                <button
                                    onClick={() => setPostType('Activity')}
                                    className={`px-2.5 mm:px-3 py-1 rounded-full text-[10px] mm:text-xs font-medium transition-colors ${postType === 'Activity' ? 'bg-[#6366f1] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
                                >
                                    Activity
                                </button>
                                <button
                                    onClick={() => setPostType('Event')}
                                    className={`px-2.5 mm:px-3 py-1 rounded-full text-[10px] mm:text-xs font-medium transition-colors ${postType === 'Event' ? 'bg-[#f59e0b] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'}`}
                                >
                                    Event
                                </button>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[#64748b] hover:text-[#6366f1] transition-colors flex items-center gap-1.5"
                            >
                                <ImageIcon size={16} />
                                <span className="text-[10px] mm:text-xs font-semibold">Photo</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                        </div>

                        <button
                            onClick={handleCreatePost}
                            disabled={(!newPostContent.trim() && imagePreviews.length === 0) || isPosting}
                            className="bg-[#6366f1] text-white px-5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-[#4f46e5] transition-colors ml-auto sm:ml-0"
                        >
                            {isPosting ? <LoadingSpinner size={16} color="border-white" /> : 'Post'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <LoadingSpinner size={40} className="py-10" />
            ) : posts.length === 0 ? (
                <div className="py-10 text-center text-[#94a3b8] text-sm">No posts yet. Be the first to start the conversation!</div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white rounded-xl mm:rounded-2xl p-3 mm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#e2e8f0]">
                            <div className="flex justify-between items-start mb-3 mm:mb-4">
                                <div className="flex gap-2 mm:gap-3">
                                    <div className="w-8 h-8 mm:w-10 mm:h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-xs mm:text-sm shadow-md">
                                        {post.author?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1e293b] text-xs mm:text-sm">{post.author}</p>
                                        <p className="text-[9px] mm:text-[10px] text-[#94a3b8] font-medium">{new Date(post.created_at).toLocaleDateString()} · {post.type}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 mm:gap-2">
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="p-1 text-[#94a3b8] hover:text-[#ef4444] transition-colors"
                                            title="Delete post"
                                        >
                                            <Trash2 size={14} mm:size={16} />
                                        </button>
                                    )}
                                    {post.type === 'Event' && (
                                        <span className="bg-[#fffbeb] text-[#d97706] p-1 mm:p-1.5 rounded-lg">
                                            <Calendar size={12} mm:size={14} />
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-[#475569] text-xs mm:text-sm leading-relaxed mb-3 mm:mb-4">
                                {post.content}
                            </p>

                            {post.images && post.images.length > 0 && (
                                <div className={`mb-4 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 mm:grid-cols-2'}`}>
                                    {post.images.map((img, idx) => (
                                        <div key={idx} className={`rounded-xl overflow-hidden border border-[#f1f5f9] ${post.images.length === 3 && idx === 0 && window.innerWidth > 480 ? 'row-span-2 h-full' : 'h-40 mm:h-48'}`}>
                                            <img
                                                src={img}
                                                alt={`Post ${idx}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-6 pt-4 border-t border-[#f1f5f9]">
                                <button
                                    onClick={() => handleToggleLike(post.id)}
                                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${user?.employee_id && post.likes.includes(user.employee_id) ? 'text-[#ef4444]' : 'text-[#94a3b8] hover:text-[#ef4444]'}`}
                                >
                                    <Heart size={16} fill={user?.employee_id && post.likes.includes(user.employee_id) ? "currentColor" : "none"} />
                                    {post.likes_count} {post.likes_count === 1 ? 'Like' : 'Likes'}
                                </button>
                                <button
                                    onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                                    className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#6366f1] text-xs font-bold transition-colors"
                                >
                                    <MessageCircle size={16} />
                                    {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
                                </button>
                            </div>

                            {/* Comment Section */}
                            {commentingOn === post.id && (
                                <div className="mt-4 space-y-3 pt-4 border-t border-[#f1f5f9] animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-3">
                                        {post.comments.map(c => {
                                            const isAuthorById = String(user?.employee_id) === String(c.author_id);
                                            const userName = (user?.first_name + ' ' + (user?.last_name || '')).trim();
                                            const isAuthorByName = userName === c.author;
                                            const canDelete = isAuthorById || isAuthorByName || isAdmin;

                                            return (
                                                <div key={c.id} className="flex gap-3 group">
                                                    <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b] text-[10px] font-bold shrink-0 border border-[#e2e8f0]">
                                                        {c.author?.[0]}
                                                    </div>
                                                    <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-[#f1f5f9] relative group-hover:border-[#6366f1]/20 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-[12px] font-bold text-[#1e293b] mb-0.5">{c.author}</p>
                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] text-[#475569] leading-relaxed">{c.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-3 items-center bg-white rounded-2xl p-2 pr-4 border border-[#e2e8f0] focus-within:border-[#6366f1] transition-colors shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] text-[10px] font-bold shrink-0">
                                            {user?.first_name?.[0].toUpperCase()}
                                        </div>
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[12px] py-1 px-1"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                        />
                                        <button
                                            onClick={() => handleAddComment(post.id)}
                                            className="text-[#6366f1] disabled:opacity-30 p-1 hover:bg-[#6366f1]/10 rounded-full transition-colors"
                                            disabled={!newComment.trim()}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {/* Deletion confirmation dialog */}
            <ConfirmDialog
                isOpen={deleteConfig.isOpen}
                title={deleteConfig.commentId ? "Delete Comment" : "Delete Post"}
                message={`Are you sure you want to delete this ${deleteConfig.commentId ? 'comment' : 'post'}? This action cannot be undone.`}
                confirmText={deleteConfig.commentId ? "Delete Comment" : "Delete Post"}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfig({ isOpen: false, postId: null, commentId: null })}
                type="danger"
                isLoading={isDeleting}
                closeOnConfirm={false}
            />
        </div>
    );
};

export default FeedSection;
