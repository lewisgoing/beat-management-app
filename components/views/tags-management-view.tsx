"use client"

import { useState } from "react"
import { useMusic } from "@/components/providers/music-provider"
import type { Tag } from "@/lib/types"
import { Edit, Trash2, Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function TagsManagementView() {
  const { tags } = useMusic()
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3357FF")
  const [editedTagName, setEditedTagName] = useState("")
  const [editedTagColor, setEditedTagColor] = useState("")

  const handleEditTag = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditedTagName(tag.name)
    setEditedTagColor(tag.color)
  }

  const handleSaveEdit = () => {
    // In a real app, you would update the tag in your state management
    setEditingTagId(null)
  }

  const handleCancelEdit = () => {
    setEditingTagId(null)
  }

  const handleCreateTag = () => {
    // In a real app, you would add the new tag to your state management
    setNewTagName("")
  }

  const handleDeleteTag = (tagId: string) => {
    // In a real app, you would remove the tag from your state management
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Tags</h1>
          <p className="text-muted-foreground">Create, edit, and delete tags to organize your beats</p>
        </div>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Create new tag card */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Tag</CardTitle>
            <CardDescription>Add a new tag to organize your beats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag Name</label>
                <Input
                  placeholder="Enter tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag Color</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: newTagColor }} />
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-12 h-8 p-0 overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreateTag} disabled={!newTagName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </CardFooter>
        </Card>

        {/* Existing tags */}
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                  {editingTagId === tag.id ? (
                    <Input
                      value={editedTagName}
                      onChange={(e) => setEditedTagName(e.target.value)}
                      className="h-7 text-base font-semibold"
                    />
                  ) : (
                    <CardTitle>{tag.name}</CardTitle>
                  )}
                </div>

                {editingTagId === tag.id ? (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTag(tag)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{tag.name}" tag? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTag(tag.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              {editingTagId === tag.id && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: editedTagColor }} />
                  <Input
                    type="color"
                    value={editedTagColor}
                    onChange={(e) => setEditedTagColor(e.target.value)}
                    className="w-12 h-8 p-0 overflow-hidden"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {/* Count of beats with this tag - in a real app, you would calculate this */}
                Used in {Math.floor(Math.random() * 10) + 1} beats
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View Beats with this Tag
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

