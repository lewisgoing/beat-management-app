"use client"

import { motion } from "framer-motion"
import type { Tag } from "@/lib/types"

interface TagFilterProps {
  tags: Tag[]
  selectedTag: string | null
  onSelectTag: (tagId: string | null) => void
}

export default function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
  
  return (
    <motion.div 
      className="flex items-center space-x-2 overflow-x-auto pb-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.button
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedTag === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
        }`}
        onClick={() => onSelectTag(null)}
        variants={item}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        All
      </motion.button>

      {tags.map((tag) => (
        <motion.button
          key={tag.id}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTag === tag.id ? "text-white" : "bg-muted hover:bg-muted/80"
          }`}
          style={{
            backgroundColor: selectedTag === tag.id ? tag.color : undefined,
          }}
          onClick={() => onSelectTag(tag.id === selectedTag ? null : tag.id)}
          variants={item}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tag.name}
        </motion.button>
      ))}
    </motion.div>
  )
}