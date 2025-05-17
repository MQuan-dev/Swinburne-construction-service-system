"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Box,
  Skeleton,
  Chip,
  Tooltip,
  Fade,
} from "@mui/material"
import Grid2 from "@mui/material/Grid2"
import { motion } from "framer-motion"
import { Edit as EditIcon, Delete as DeleteIcon, Category as CategoryIcon } from "@mui/icons-material"
import "../../css/CategoryList.css"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL

// Wrap Material UI components with motion
const MotionCard = motion(Card)
const MotionAvatar = motion(Avatar)

const CategoryList = ({ categories, setCategories }) => {
  const navigate = useNavigate()
  const hasFetchedData = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true

      axios
        .get(`${API_BASE_URL}/category/`)
        .then((response) => {
          if (Array.isArray(response.data)) {
            setCategories(response.data.sort((a, b) => a.id - b.id))
          } else {
            setError("Invalid category data.")
          }
        })
        .catch(() => setError("Failed to load categories. Check API server."))
        .finally(() => setLoading(false))
    }
  }, [setCategories])

  const handleDelete = (id) => {
    const token = localStorage.getItem("accessToken")
    if (window.confirm("Are you sure you want to delete this category?")) {
      axios
        .delete(`${API_BASE_URL}/category/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id))
        })
        .catch((error) => {
          console.error("Error deleting category:", error)
        })
    }
  }

  const handleEdit = (id) => {
    navigate(`/admin/categories/edit/${id}`)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  }

  const avatarVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      },
    },
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.3,
      },
    },
  }

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from(new Array(8)).map((_, index) => (
      <Grid2  key={`skeleton-${index}`}>
        <Card className="skeleton-card">
          <Box className="skeleton-avatar-container">
            <Skeleton variant="circular" width={80} height={80} />
          </Box>
          <Skeleton variant="text" height={32} className="skeleton-title" />
          <Skeleton variant="text" height={20} className="skeleton-text" />
          <Skeleton variant="text" height={20} width="60%" className="skeleton-chip" />
          <Box className="skeleton-actions">
            <Skeleton variant="rounded" width={60} height={36} />
            <Skeleton variant="rounded" width={60} height={36} />
          </Box>
        </Card>
      </Grid2>
    ))
  }

  return (
    <motion.div
      className="category-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Typography variant="h4" component="h2" className="category-title">
          Manage Categories
        </Typography>
      </motion.div>

      {loading ? (
        <Grid2>
          {renderSkeletons()}
        </Grid2>
      ) : error ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Typography variant="body1" color="error" className="error-message">
            {error}
          </Typography>
        </motion.div>
      ) : categories.length > 0 ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="category-list-grid-container">
          <Grid2 container spacing={3} className="category-grid-container">
            {categories.map((category) => {
              const imageUrl = category.icon
                ? `${API_BASE_URL.replace("/api/v1", "")}/${category.icon.replace(/^\/?media\//, "media/")}?t=${new Date().getTime()}`
                : "https://via.placeholder.com/80"

              return (
                <Grid2 className="grid-container" key={category.id}>
                  <motion.div variants={itemVariants}>
                    <MotionCard
                      className="category-card"
                      whileHover={{
                        y: -8,
                        boxShadow: "0 20px 30px rgba(0,0,0,0.1)",
                        transition: { duration: 0.3 },
                      }}
                    >
                      <CardContent className="card-content">
                        <Box className="avatar-container">
                          <MotionAvatar
                            src={imageUrl}
                            alt={category.name}
                            className="category-avatar"
                            variants={avatarVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                          />
                        </Box>
                        <Typography variant="h6" align="center" className="category-name">
                          {category.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          align="center"
                          className="category-description"
                        >
                          {category.description}
                        </Typography>
                        <Chip
                          icon={<CategoryIcon fontSize="small" />}
                          label={category.category}
                          size="small"
                          className="category-chip"
                        />
                      </CardContent>
                      <CardActions className="card-actions">
                        <Tooltip title="Edit Category" slots={{ transition: Fade }} arrow>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => handleEdit(category.id)}
                            className="edit-button"
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete Category" slots={{ transition: Fade }} arrow>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(category.id)}
                            className="delete-button"
                          >
                            Delete
                          </Button>
                        </Tooltip>
                      </CardActions>
                    </MotionCard>
                  </motion.div>
                </Grid2>
              )
            })}
          </Grid2>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box className="empty-container">
            <Typography variant="body1">No categories available</Typography>
          </Box>
        </motion.div>
      )}
    </motion.div>
  )
}

export default CategoryList

