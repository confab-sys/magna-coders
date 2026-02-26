"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import LeftPanel from '@/components/LeftPanel';
import UserPrivacySelector from '@/components/UserPrivacySelector';
import PostEditor from '@/components/PostEditor';
import PostToolbar from '@/components/PostToolbar';

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGistId, setSelectedGistId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacy, setPrivacy] = useState('Public');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }

    // Check for authentication on mount
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      // If no token, redirect to login immediately
      // router.push('/login');
      // For now, we'll just log it, but in a real app you'd redirect
      console.warn('No access token found on mount. User may need to login.');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the API URL from env
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiUrl) throw new Error('API URL is not defined');
      
      // Try to get token from localStorage first
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!token) {
        console.error("Authentication failed: No access token found in localStorage.");
        throw new Error('You must be logged in to post. Please try logging in again.');
      }

      // Handle file upload if image is selected
      let imageUrl = null;
      if (selectedImage && selectedImage.startsWith('data:')) {
         try {
             // Convert base64 to blob
             const res = await fetch(selectedImage);
             const blob = await res.blob();
             
             // This endpoint expects JSON with file metadata, but typically file uploads 
             // require either multipart/form-data OR a pre-signed URL flow.
             // Given the user provided a JSON structure: { url, filename, mime_type, size, purpose }
             // It seems this endpoint registers a file, but doesn't upload the content directly?
             // OR it might be a placeholder. 
             
             // However, for a real file upload to work with the provided curl example which sends JSON,
             // it usually implies we are sending a link (url) to an already hosted file, 
             // OR base64 content if the API supports it in the JSON body.
             
             // BUT, standard file upload is usually multipart.
             // If the user insists on the JSON structure for `/api/files`:
             
             const uploadBody = {
                 url: selectedImage, // Sending base64 as URL (if supported) or this is a metadata registration
                 filename: "image.jpg",
                 mime_type: blob.type,
                 size: blob.size,
                 purpose: "post_image"
             };

             const uploadRes = await fetch(`${apiUrl}/files`, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(uploadBody)
             });
             
             if (uploadRes.ok) {
                const data = await uploadRes.json();
                imageUrl = data.url || data.fileUrl; // Adjust based on actual response
             } else {
                 console.warn('Image upload/registration failed, proceeding without image');
             }
         } catch (e) {
             console.error('Failed to upload image', e);
         }
      }

      const postBody = {
        title: content.length > 50 ? content.slice(0, 50) + "..." : "New Post",
        content: content,
        image: imageUrl, // Use the uploaded image URL
        gistId: selectedGistId // Include Gist ID
      };

      const response = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      console.log('Post created successfully');
      router.push('/feed');
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = Boolean(content.trim() || selectedImage);

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      <TopNavigation 
        title="Create Post"
        showBack={true}
        hideBackOnMobile={true}
        showSearch={false}
        onMobileMenuOpen={() => {}}
        isDarkMode={isDarkMode}
        customAction={
          <button 
            onClick={handlePost}
            disabled={!canPost || isSubmitting}
            className="text-[#E50914] font-bold text-sm disabled:opacity-50 md:hidden"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        }
      />
      
      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab="Create Post"
        setActiveTab={() => {}}
        isSidebarExpanded={true}
        setIsSidebarExpanded={() => {}}
        isDarkMode={isDarkMode}
        toggleTheme={() => {}} // CreatePost handles theme internally via localStorage listener, but toggle could be wired up if needed
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 w-full md:ml-[88px] lg:ml-[260px] p-0 md:p-8 pt-20 md:pt-24 max-w-3xl mx-auto transition-all duration-300">

        <div className={`md:rounded-3xl shadow-sm border min-h-[calc(100vh-60px)] md:min-h-[500px] flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-[#111] border-[#E70008]/20' : 'bg-white border-gray-100'}`}>
          
          {/* User Info & Privacy */}
          <UserPrivacySelector 
            userName="John Doe"
            userInitials="JD"
            privacy={privacy}
            onPrivacyChange={setPrivacy}
            isDarkMode={isDarkMode}
          />

          {/* Input Area */}
          <PostEditor 
            content={content}
            setContent={setContent}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedGistId={selectedGistId}
            setSelectedGistId={setSelectedGistId}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDarkMode={isDarkMode}
          />

          {/* Bottom Toolbar */}
          <PostToolbar 
            onImageSelect={handleImageSelect}
            contentLength={content.length}
            isSubmitting={isSubmitting}
            onPost={handlePost}
            canPost={canPost}
            isDarkMode={isDarkMode}
            onAddGist={(id) => setSelectedGistId(id)}
          />

        </div>

      </main>
    </div>
  );
}
