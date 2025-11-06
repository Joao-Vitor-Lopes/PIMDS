using System.ComponentModel.DataAnnotations;

namespace PrimeGorilaAPI.Models
{
    public class Usuario
    {
        [Key]
        public int id_usuario { get; set; }
        public string nome { get; set; }
        public string email { get; set; }
        public string senha { get; set; }
        public string tipo_usuario { get; set; } = "normal";
    }
}
