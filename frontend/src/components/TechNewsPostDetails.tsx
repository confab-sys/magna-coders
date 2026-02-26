import React from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import type { TechNewsPost } from '@/types';
import PostInteractionBar from './PostInteractionBar';

interface TechNewsPostDetailsProps {
  post: TechNewsPost;
}

export default function TechNewsPostDetails({ post }: TechNewsPostDetailsProps) {
  return (
    <div className="space-y-6 px-1 sm:px-0">
      <div className="relative w-full h-52 sm:h-72 md:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden">
        {post.imageUrl ? (
          <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-white/90">
            <span className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/15 backdrop-blur">
              <Globe size={14} />
              {post.source || 'Tech News'}
            </span>
            <span className="text-white/70">{post.createdAt}</span>
          </div>
          <h2 className="mt-2 sm:mt-3 text-lg sm:text-2xl md:text-4xl font-bold text-white leading-tight">{post.title}</h2>
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-sm sm:text-lg md:text-xl text-gray-700 leading-relaxed">
          {post.summary}
        </p>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Full Story</div>
          <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
            This article is summarized from {post.source || 'the source'}. Open the full story to read the complete coverage and context.
          </p>
        </div>
      </div>
      
      <PostInteractionBar initialLikes={post.likes} initialComments={post.comments} initialCommentsData={generateMockComments(post.id, post.comments)} postId={post.id} />

      <a href={post.url} target="_blank" rel="noopener noreferrer" className="block w-full py-3 sm:py-4 rounded-xl bg-black text-white font-semibold text-sm sm:text-base shadow-md hover:bg-gray-800 transition-all text-center transform hover:-translate-y-1">
        Read Full Article
      </a>
    </div>
  );
}
