using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrimeGorilaAPI.Models
{
    public class Chamado
    {
        [Key]
        public int id_chamado { get; set; }

        [Required]
        public string titulo { get; set; }

        [Required]
        public string descricao { get; set; }

        [Required]
        public string prioridade { get; set; }

        public string status { get; set; } = "Aberto";
        public DateTime data_abertura { get; set; } = DateTime.Now;

        [ForeignKey("Usuario")]
        public int? usuario_id { get; set; }  // <-- FK opcional
        public Usuario? Usuario { get; set; }

    }
}
