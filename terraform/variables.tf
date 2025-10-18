variable "name" {
  description = "Name of the EC2 instance"
  type        = string
  
}

variable "instance_type" {
  description = "Type of EC2 instance"
  type        = string
}

variable "region" {
  description = "AWS region to deploy to"
  type        = string
}

variable "storage" {
  description = "Root volume size in GB"
  type        = number
}

variable "os" {
  description = "Operating system (ubuntu or amazon-linux)"
  type        = string
}
