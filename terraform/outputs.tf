output "instance_id" {
  value = aws_instance.web.id
}

output "instance_public_ip" { //3al4an lma asta5demo fe ansible a3rf a3mel connect 3ala el instance
  value = aws_instance.web.public_ip
}
