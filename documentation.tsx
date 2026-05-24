"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Video,
  FileText,
  Download,
  Upload,
  Search,
  Eye,
  Share2,
  Calendar,
  User,
  Tag,
  ImageIcon,
  Play,
  Volume2,
} from "lucide-react"

// Sample documentation data
const documentationData = [
  {
    id: 1,
    title: "Persiapan Penyembelihan Sapi #1",
    type: "photo",
    category: "qurban",
    date: "2024-01-15",
    time: "07:30",
    photographer: "Ahmad Rizki",
    description: "Dokumentasi persiapan penyembelihan sapi pertama",
    tags: ["sapi", "persiapan", "penyembelihan"],
    fileUrl: "/placeholder.svg?height=200&width=300",
    thumbnail: "/placeholder.svg?height=100&width=150",
    status: "published",
    views: 45,
    downloads: 12,
  },
  {
    id: 2,
    title: "Proses Pemotongan Daging",
    type: "video",
    category: "qurban",
    date: "2024-01-15",
    time: "08:45",
    photographer: "Maya Sari",
    description: "Video dokumentasi proses pemotongan daging qurban",
    tags: ["pemotongan", "daging", "proses"],
    fileUrl: "/placeholder.svg?height=200&width=300",
    thumbnail: "/placeholder.svg?height=100&width=150",
    status: "published",
    views: 78,
    downloads: 23,
    duration: "05:32",
  },
  {
    id: 3,
    title: "Distribusi Daging ke Warga",
    type: "photo",
    category: "distribusi",
    date: "2024-01-15",
    time: "11:00",
    photographer: "Budi Santoso",
    description: "Dokumentasi distribusi daging qurban kepada warga",
    tags: ["distribusi", "warga", "daging"],
    fileUrl: "/placeholder.svg?height=200&width=300",
    thumbnail: "/placeholder.svg?height=100&width=150",
    status: "draft",
    views: 12,
    downloads: 3,
  },
  {
    id: 4,
    title: "Laporan Kegiatan Qurban 2024",
    type: "document",
    category: "laporan",
    date: "2024-01-15",
    time: "16:00",
    photographer: "Siti Nurhaliza",
    description: "Laporan lengkap kegiatan qurban tahun 2024",
    tags: ["laporan", "qurban", "2024"],
    fileUrl: "/placeholder.svg?height=200&width=300",
    thumbnail: "/placeholder.svg?height=100&width=150",
    status: "published",
    views: 156,
    downloads: 45,
    fileSize: "2.5 MB",
  },
  {
    id: 5,
    title: "Konsumsi Panitia Pagi",
    type: "photo",
    category: "konsumsi",
    date: "2024-01-15",
    time: "06:30",
    photographer: "Dedi Kurniawan",
    description: "Dokumentasi konsumsi pagi untuk panitia",
    tags: ["konsumsi", "panitia", "pagi"],
    fileUrl: "/placeholder.svg?height=200&width=300",
    thumbnail: "/placeholder.svg?height=100&width=150",
    status: "published",
    views: 34,
    downloads: 8,
  },
]

const categories = ["Semua", "qurban", "distribusi", "konsumsi", "laporan", "acara"]
const documentTypes = ["Semua", "photo", "video", "document"]

export default function Documentation() {
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [selectedType, setSelectedType] = useState("Semua")
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Filter documentation data
  const filteredData = documentationData.filter((doc) => {
    const matchesCategory = selectedCategory === "Semua" || doc.category === selectedCategory
    const matchesType = selectedType === "Semua" || doc.type === selectedType
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesCategory && matchesType && matchesSearch
  })

  // Calculate statistics
  const totalDocs = documentationData.length
  const totalPhotos = documentationData.filter((doc) => doc.type === "photo").length
  const totalVideos = documentationData.filter((doc) => doc.type === "video").length
  const totalDocuments = documentationData.filter((doc) => doc.type === "document").length
  const totalViews = documentationData.reduce((sum, doc) => sum + doc.views, 0)
  const totalDownloads = documentationData.reduce((sum, doc) => sum + doc.downloads, 0)

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "photo":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-500">
            Published
          </Badge>
        )
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle view document
  const handleViewDocument = (doc: any) => {
    setSelectedDoc(doc)
    setIsViewDialogOpen(true)
  }

  return (
    <div className="app-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dokumentasi Kegiatan</h1>
            <p className="page-subtitle">Kelola foto, video, dan dokumen kegiatan panitia</p>
          </div>
          <div className="page-actions">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Dokumentasi</DialogTitle>
                  <DialogDescription>Upload foto, video, atau dokumen kegiatan</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="doc-title">Judul Dokumentasi</Label>
                    <Input id="doc-title" placeholder="Masukkan judul dokumentasi" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="doc-type">Jenis File</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="photo">Foto</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="document">Dokumen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-category">Kategori</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qurban">Qurban</SelectItem>
                          <SelectItem value="distribusi">Distribusi</SelectItem>
                          <SelectItem value="konsumsi">Konsumsi</SelectItem>
                          <SelectItem value="laporan">Laporan</SelectItem>
                          <SelectItem value="acara">Acara</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doc-description">Deskripsi</Label>
                    <Textarea id="doc-description" placeholder="Deskripsi dokumentasi..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doc-tags">Tags (pisahkan dengan koma)</Label>
                    <Input id="doc-tags" placeholder="tag1, tag2, tag3" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doc-file">Upload File</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Drag & drop file atau klik untuk browse</p>
                      <p className="text-xs text-gray-400 mt-1">Maksimal 50MB (JPG, PNG, MP4, PDF)</p>
                      <Input id="doc-file" type="file" className="hidden" />
                      <Button variant="outline" size="sm" className="mt-2">
                        Pilih File
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" onClick={() => setIsUploadDialogOpen(false)}>
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stat-grid">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dokumentasi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocs}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Foto: {totalPhotos}</span>
                <span>|</span>
                <span>Video: {totalVideos}</span>
                <span>|</span>
                <span>Dok: {totalDocuments}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Kali dilihat</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Kali diunduh</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.8 GB</div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={56} className="h-1 flex-1" />
                <span className="text-xs text-muted-foreground">56%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Dokumentasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="toolbar-grid">
              <div className="flex-1">
                <Label htmlFor="search">Cari</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari judul, deskripsi, atau tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="category">Kategori</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="type">Jenis File</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList className="tabs-responsive grid-cols-3">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Grid View */}
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((doc) => (
                <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={doc.thumbnail || "/placeholder.svg"}
                      alt={doc.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getFileTypeIcon(doc.type)}
                        {doc.type}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">{getStatusBadge(doc.status)}</div>
                    {doc.type === "video" && doc.duration && (
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="default" className="bg-black/70 text-white">
                          {doc.duration}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{doc.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>{doc.date}</span>
                      <span>|</span>
                      <User className="h-3 w-3" />
                      <span>{doc.photographer}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {doc.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {doc.downloads}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDocument(doc)}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Dokumentasi</CardTitle>
                <CardDescription>Tampilan list semua dokumentasi kegiatan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Photographer</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                src={doc.thumbnail || "/placeholder.svg"}
                                alt={doc.title}
                                className="w-10 h-10 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                              <div>
                                <div className="font-medium text-sm">{doc.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">{doc.description}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              {getFileTypeIcon(doc.type)}
                              {doc.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{doc.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{doc.date}</div>
                              <div className="text-xs text-muted-foreground">{doc.time}</div>
                            </div>
                          </TableCell>
                          <TableCell>{doc.photographer}</TableCell>
                          <TableCell>{doc.views}</TableCell>
                          <TableCell>{doc.downloads}</TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dokumentasi per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.slice(1).map((category) => {
                      const count = documentationData.filter((doc) => doc.category === category).length
                      const percentage = (count / totalDocs) * 100
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{category}</span>
                            <span>{count} files</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dokumentasi per Jenis File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documentTypes.slice(1).map((type) => {
                      const count = documentationData.filter((doc) => doc.type === type).length
                      const percentage = (count / totalDocs) * 100
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize flex items-center gap-2">
                              {getFileTypeIcon(type)}
                              {type}
                            </span>
                            <span>{count} files</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Dokumentasi (Views)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentationData
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 5)
                      .map((doc, index) => (
                        <div key={doc.id} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <img
                            src={doc.thumbnail || "/placeholder.svg"}
                            alt={doc.title}
                            className="w-8 h-8 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">{doc.views} views</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Dokumentasi (Downloads)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentationData
                      .sort((a, b) => b.downloads - a.downloads)
                      .slice(0, 5)
                      .map((doc, index) => (
                        <div key={doc.id} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <img
                            src={doc.thumbnail || "/placeholder.svg"}
                            alt={doc.title}
                            className="w-8 h-8 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">{doc.downloads} downloads</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedDoc && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getFileTypeIcon(selectedDoc.type)}
                    {selectedDoc.title}
                  </DialogTitle>
                  <DialogDescription>{selectedDoc.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* File Preview */}
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    {selectedDoc.type === "photo" && (
                      <img
                        src={selectedDoc.fileUrl || "/placeholder.svg"}
                        alt={selectedDoc.title}
                        className="max-w-full max-h-96 mx-auto rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=400&width=600"
                        }}
                      />
                    )}
                    {selectedDoc.type === "video" && (
                      <div className="bg-black rounded-lg p-8 text-white">
                        <Video className="h-16 w-16 mx-auto mb-4" />
                        <p>Video Player</p>
                        <p className="text-sm text-gray-300">Duration: {selectedDoc.duration}</p>
                        <div className="flex items-center justify-center gap-4 mt-4">
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Play
                          </Button>
                          <Button variant="outline" size="sm">
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedDoc.type === "document" && (
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">Document Preview</p>
                        <p className="text-sm text-gray-400">
                          {selectedDoc.fileSize && `File Size: ${selectedDoc.fileSize}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* File Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Detail File</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Kategori:</span>
                          <Badge variant="secondary">{selectedDoc.category}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Tanggal:</span>
                          <span>
                            {selectedDoc.date} {selectedDoc.time}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Photographer:</span>
                          <span>{selectedDoc.photographer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          {getStatusBadge(selectedDoc.status)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Statistik</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Views:</span>
                          <span>{selectedDoc.views}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downloads:</span>
                          <span>{selectedDoc.downloads}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
