// components/import-from-dropbox.tsx
"use client"

import { useMusic } from "@/components/providers/music-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DropboxFilePicker from "@/components/dropbox-file-picker"

export default function ImportFromDropbox() {
  const { isDropboxPickerOpen, closeDropboxPicker, addBeats } = useMusic()
  
  return (
    <DropboxFilePicker 
    onFilesSelected={addBeats} 
    onClose={closeDropboxPicker}
  />
    // <Dialog open={isDropboxPickerOpen} onOpenChange={(open) => !open && closeDropboxPicker()}>
    //   <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0">
    //     <DialogHeader className="p-4 border-b">
    //       <DialogTitle>Import from Dropbox</DialogTitle>
    //     </DialogHeader>
        
    //     <div className="overflow-y-auto">
    //       <DropboxFilePicker 
    //         onFilesSelected={addBeats} 
    //         onClose={closeDropboxPicker}
    //       />
    //     </div>
    //   </DialogContent>
    // </Dialog>
  )
}