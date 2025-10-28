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

// hena ba3mel security group 3ashan afta7 el ports el mohema zay el SSH w el HTTP
resource "aws_security_group" "instance_sg" {
  name        = "instance-security-group"
  description = "Allow SSH and HTTP access"

  ingress {
    from_port   = 22        // SSH port
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] // allow access from anywhere
  }

  ingress {
    from_port   = 80        // HTTP port
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"      // allow all outbound traffic
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" { // hena ba3mel el instance bta3i 
  ami           = var.os == "ubuntu" ? data.aws_ami.ubuntu.id : data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = "myDeffaultKeyPair" // el key pair ele ana 3amltaha fel AWS console 3ashan a3mel connect 3ala el instance b SSH

  root_block_device {
    volume_size = var.storage
  }

  vpc_security_group_ids = [aws_security_group.instance_sg.id] // link el instance bel security group

  tags = {
    Name = "${var.name}" // IMPORTANT: hena el mafrod yekon el tag bta3 el name beta3 el instance
  }
}
