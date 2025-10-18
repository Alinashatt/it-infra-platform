provider "aws" {
  region = var.region
}
//hena ana ba3mel data source 3ashan agib a5er AMI lel ubuntu w amazon linux
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # hena deh el owner ID beta3 ubuntu

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

//hena ana ba3mel data source 3ashan agib a5er AMI lel amazon linux
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "web" {
  ami           = var.os == "ubuntu" ? data.aws_ami.ubuntu.id : data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  root_block_device {
    volume_size = var.storage
  }

  tags = {
    Name = "itinfra-${var.name}" // IMPORTANT: hena el mafrod yekon el tag bta3 el name beta3 el instance
  }
}


