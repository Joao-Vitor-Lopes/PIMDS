using System.ComponentModel.DataAnnotations;

namespace PrimeGorilaAPI.Models
{
    public class Usuario
    {
        [Key]
        public int id_usuario { get; set; }

        [Required]
        public string nome { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string email { get; set; } = string.Empty;

        [Required]
        public string senha { get; set; } = string.Empty;

        public string tipo_usuario { get; set; } = "normal";
    }
}
